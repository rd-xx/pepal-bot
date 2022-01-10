import { makeRequest } from '../utils/https.helper';
import UserEntity from '../database/user.entity';
import { palette } from '../utils/constants';
import { MessageEmbed } from 'discord.js';
import { getConnection } from 'typeorm';
import Pepal from '../structure/pepal';
import { Task } from 'discord-akairo';
import { DateTime } from 'luxon';

// -------------------------------------------------- \\

export default class PresenceTask extends Task {
	constructor() {
		super('presence', {
			delay: 1 * 60 * 1000, // 1 minute,
			runOnStart: true
		});
	}

	/**
	 * Toutes les minutes, cette fonction récupère tout les utilisateurs du bot.
	 * Elle envoie 3 requêtes par utilisation pour vérifier s'il faut valider l'appel.
	 * Théoriquement, elle n'est pas saîne pour Pepal s'il y a beaucoup d'utilisateurs.
	 */
	async exec(): Promise<void> {
		const dateObject = DateTime.local({ zone: 'Europe/Paris' }),
			userRepo = getConnection().getRepository(UserEntity),
			users = await userRepo.find();

		// Il est préférable d'utiliser .forEach pour qu'il exécute toutes les itérations en même temps.
		users.forEach(async (user) => {
			if (!user.ppCookie) return;
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
				.filter(
					(lesson) =>
						DateTime.fromJSDate(lesson.start).get('month') ===
							dateObject.get('month') &&
						DateTime.fromJSDate(lesson.start).get('day') ===
							dateObject.get('day')
				)
				.sort((a, b) => +a.start - +b.start);
			if (lessonsToday.length) {
				await pepal.getPresences();
				const openedPresence = pepal.presences.find(
					(presence) => presence.opened
				);

				if (openedPresence) {
					const discordUser = await this.client.users.fetch(pepal.discordId),
						embed = new MessageEmbed().setURL(
							`https://www.pepal.eu/presences/s/${openedPresence.id}`
						);

					if (user.presenceMode === 'warn') {
						embed.setTitle('Appel ouvert');
						embed.setColor(palette.warning);
						embed.setDescription(
							`L'appel du cours de **${openedPresence.discipline}** est ouvert !`
						);
					} else {
						const rawResponse =
							(await makeRequest(
								user.ppCookie,
								'student/upload.php',
								`act=set_present&seance_pk=${openedPresence.id}`
							)) + '';

						if (rawResponse.includes('validée')) {
							embed.setTitle('Présence validée');
							embed.setColor(palette.success);
							embed.setDescription(
								`L'appel du cours de **${openedPresence.discipline}** a bien été effectué !`
							);
						} else {
							embed.setTitle('Présence non validée');
							embed.setColor(palette.error);
							embed.setDescription(
								`Il n'a pas été possible d'effectuer l'appel du cours de **${openedPresence.discipline}**. Veuillez le faire manuellement.`
							);
						}
					}

					await discordUser.send({ embeds: [embed] });
				} else return;
			}
		});
	}
}
