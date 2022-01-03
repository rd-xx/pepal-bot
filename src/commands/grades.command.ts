import { Message, MessageEmbed } from 'discord.js';
import { palette } from '../utils/constants';
import { Command } from 'discord-akairo';
import Pepal from '../structure/pepal';
import { DateTime } from 'luxon';

// -------------------------------------------------- \\

export default class ChangeDomainCommand extends Command {
	constructor() {
		super('grades', {
			aliases: ['notes', 'note'],
			args: [
				{
					id: 'cookie',
					prompt: {
						start: 'Quel le cookie de session ?'
					}
				}
			]
		});
	}

	async exec(
		message: Message,
		{ cookie }: { cookie: string }
	): Promise<Message> {
		const pepal = new Pepal(cookie),
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
