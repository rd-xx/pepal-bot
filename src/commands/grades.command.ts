import { Message, MessageEmbed } from 'discord.js';
import UserEntity from '../database/user.entity';
import { palette } from '../utils/constants';
import { Command } from 'discord-akairo';
import { getConnection } from 'typeorm';
import Pepal from '../structure/pepal';
import { DateTime } from 'luxon';

// -------------------------------------------------- \\

export default class ChangeDomainCommand extends Command {
	constructor() {
		super('grades', {
			aliases: ['notes', 'note']
		});
	}

	async exec(message: Message): Promise<Message> {
		const user = await getConnection()
			.getRepository(UserEntity)
			.findOne({ discordId: message.author.id });

		if (!user || !user.ppCookie)
			throw new Error(
				"Une erreur inespérée s'est produite. Il paraît que l'utilisateur n'est pas enregistré dans la base de données."
			);

		const pepal = new Pepal(user.ppCookie),
			embed = new MessageEmbed();
		await pepal.getGrades();

		embed.setTitle('Notes');
		embed.setColor(palette.success);

		let description = '';
		for (const grade of pepal.grades
			.sort((a, b) => b.date.getTime() - a.date.getTime())
			.values())
			description += `${DateTime.fromJSDate(grade.date).toLocaleString(
				DateTime.DATE_SHORT,
				{ locale: 'fr' }
			)} — **${grade.discipline}** : ${grade.title} » **${grade.grade}**\n`;

		embed.setDescription(description.trim());
		return await message.reply({ embeds: [embed] });
	}
}
