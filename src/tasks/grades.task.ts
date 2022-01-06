import UserEntity from '../database/user.entity';
import { palette } from '../utils/constants';
import { MessageEmbed } from 'discord.js';
import { getConnection } from 'typeorm';
import Pepal from '../structure/pepal';
import { Task } from 'discord-akairo';
import { DateTime } from 'luxon';

// -------------------------------------------------- \\

export default class GradesTask extends Task {
	constructor() {
		super('grades', {
			delay: 30 * 60 * 1000, // 30 minutes,
			runOnStart: true
		});
	}

	async exec(): Promise<void> {
		console.log('entrei');

		const userRepo = getConnection().getRepository(UserEntity),
			users = await userRepo.find();

		for (const user of users.values()) {
			let pepal: Pepal | undefined;
			try {
				pepal = await Pepal.init(user.discordId as string);
			} catch (error) {
				if (error instanceof Error && error.message.includes('cookie'))
					continue;
				else console.error(error);
			}

			if (!pepal) return;
			else await pepal.getGrades();

			console.log(
				"'" + user.currentGrades + "'",
				"'" + pepal.grades.length + "'"
			);
			console.log(typeof user.currentGrades, typeof pepal.grades.length);

			if (user.currentGrades === undefined || user.currentGrades === null) {
				user.currentGrades = pepal.grades.length;
				await userRepo.save(user);
				continue;
			} else if (user.currentGrades !== pepal.grades.length) {
				const discordUser = await this.client.users.fetch(pepal.discordId),
					recentGrades = pepal.grades.slice(
						0,
						pepal.grades.length - user.currentGrades
					),
					embed = new MessageEmbed()
						.setTitle('Nouvelle note disponible')
						.setURL('https://www.pepal.eu/?my=notes')
						.setColor(palette.success);

				for (const [i, grade] of recentGrades.entries()) {
					if (i % 2 === 0) embed.addField('\u3000', '\u3000');
					embed.addField(
						grade.discipline,
						`${
							grade.discipline.toLowerCase() === grade.title.toLowerCase()
								? ''
								: `**Sujet** : ${grade.title}`
						}
						**Date** : ${DateTime.fromJSDate(grade.date).toLocaleString(
							DateTime.DATE_HUGE,
							{ locale: 'fr' }
						)}
						**Note** : **${grade.grade}**`
					);
				}

				console.log('pepal grades', typeof pepal.grades.length);

				user.currentGrades = pepal.grades.length;
				await userRepo.save(user);

				try {
					await discordUser.send({ embeds: [embed] });
				} catch {}
			}
		}
	}
}
