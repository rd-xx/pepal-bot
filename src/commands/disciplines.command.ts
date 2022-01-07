import { Message, MessageEmbed } from 'discord.js';
import { palette } from '../utils/constants';
import { Command } from 'discord-akairo';
import Pepal from '../structure/pepal';

// -------------------------------------------------- \\

export default class DisciplinesCommand extends Command {
	constructor() {
		super('disciplines', {
			aliases: ['matières', 'matieres', 'matière', 'matiere']
		});
	}

	async exec(message: Message): Promise<Message> {
		const pepal = await Pepal.init(message.author.id),
			embed = new MessageEmbed()
				.setColor(palette.success)
				.setTitle('Matières')
				.setFooter({ text: 'MATIERE : COEFFICIENT' });

		await pepal.getGrades();
		pepal.disciplines.sort((a, b) => b.coefficient - a.coefficient); // Trier pas coefficient
		pepal.disciplines.sort(
			(a, b) =>
				a.coefficient === b.coefficient ? b.name.length - a.name.length : 0 // Trier du nom le plus grand au plus petit
		);
		let description = `Il y a au total ${pepal.disciplines.length} matières.\n\n`;

		for (const [i, discipline] of pepal.disciplines.entries()) {
			console.log("'" + discipline.name + "'");

			description += `**${discipline.name}** : ${discipline.coefficient}\n${
				pepal.disciplines[i + 1]?.coefficient !== discipline.coefficient
					? '\n'
					: ''
			}`;
		}

		embed.setDescription(description);
		return await message.reply({
			embeds: [embed],
			allowedMentions: { repliedUser: false }
		});
	}
}
