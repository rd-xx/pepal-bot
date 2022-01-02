import { Message, MessageEmbed } from 'discord.js';
import { palette } from '../utils/constants';
import { Command } from 'discord-akairo';
import { format } from 'tsuki-utilities';
import Pepal from '../structure/pepal';

// -------------------------------------------------- \\

export default class ChangeDomainCommand extends Command {
	constructor() {
		super('grades', {
			aliases: ['notes', 'note'],
			args: [
				{
					id: 'cookie',
					match: 'rest'
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
		for (const grade of pepal.grades.values())
			description += `**${grade.discipline}** : ${grade.title} > **${grade.grade}**\ ||${grade.date}||\n`;

		embed.setDescription(format(description));
		return await message.reply({ embeds: [embed] });
	}
}
