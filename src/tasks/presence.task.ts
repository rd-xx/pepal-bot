import UserEntity from '../database/user.entity';
import { getConnection } from 'typeorm';
import { Task } from 'discord-akairo';
import { DateTime } from 'luxon';
import Pepal from '../structure/pepal';
import { MessageEmbed } from 'discord.js';
import { palette } from '../utils/constants';
import { makeRequest } from '../utils/https.helper';

// -------------------------------------------------- \\

export default class PresenceTask extends Task {
	constructor() {
		super('presence', {
			delay: 1 * 60 * 1000, // 1 minute,
			runOnStart: true
		});
	}

	async exec(): Promise<void> {
		const dateObject = DateTime.local({ zone: 'Europe/Paris' });
		console.log(dateObject.get('hour'), dateObject.get('minute'));

		// if ([9, 13, 4].includes(hour) && [0, 30, 26, 27].includes(minutes))

		const userRepo = getConnection().getRepository(UserEntity),
			users = await userRepo.find();

		// Il est préférable d'utiliser .forEach pour qu'il exécute toutes les itérations en même temps.
		users.forEach(async (user) => {
			if (!user.ppCookie) return;
			else if (!user.presenceMode) return;
			else if (user.presenceMode === 'off') return;

			let pepal: Pepal | undefined;
			try {
				pepal = await Pepal.init(user.discordId as string);
			} catch (error) {
				if (error instanceof Error && error.message.includes('cookie')) return;
				else console.error(error);
			}

			if (!pepal) return;
			else await pepal.getTimeTable();

			const lessonsToday = pepal.timeTable
				.filter((lesson) => {
					const lessonDateObject = DateTime.fromJSDate(lesson.start);
					return (
						lessonDateObject.get('month') === dateObject.get('month') &&
						lessonDateObject.get('day') === dateObject.get('day')
					);
				})
				.sort((a, b) => +a.start - +b.start);
			if (lessonsToday.length) {
				await pepal.getPresences();
				const lessonPresence = pepal.presences.find(
					(presence) =>
						DateTime.fromJSDate(presence.start).get('hour') ===
						dateObject.get('hour')
				);

				if (lessonPresence) {
					const discordUser = await this.client.users.fetch(pepal.discordId),
						embed = new MessageEmbed();

					if (user.presenceMode === 'warn') {
						embed.setTitle('Appel ouvert');
						embed.setURL(
							`https://www.pepal.eu/presences/s/${lessonPresence.id}`
						);
						embed.setColor(palette.warning);
						embed.setDescription(
							`L'appel du cours de **${lessonPresence.discipline}** est ouvert!`
						);
					} else
					/**
					 * WIP
					 * /!\ Besoin de plus d'informations sur comment est affiché un appel ouvert sur Pepal pour déterminer si l'appel a déjà été validé /!\
					 * Besoin de plus d'informations sur la réponse d'un appel validé avec succès, car même si une tentative de valider l'appel est effectué à 6 heures du matin,
					 * Pepal renvoie un code 200 et :
					 *  swal({
								title: "",
								html: "La séance est terminée<br /> Validation impossible.",
								type: "error",
								showCancelButton: false,
								showConfirmButton: true,
						  },
						  function() {
								location.reload();
						  });
					 */
						await makeRequest(
							user.ppCookie,
							'student/upload.php',
							`act=set_present&seance_pk=${lessonPresence.id}`
						);

					await discordUser.send({ embeds: [embed] });
				} else return;
			}
		});
	}
}
