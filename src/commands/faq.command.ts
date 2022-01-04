import { Message, MessageEmbed } from 'discord.js';
import { palette } from '../utils/constants';
import { Command } from 'discord-akairo';

export default class FaqCommand extends Command {
	constructor() {
		super('faq', {
			aliases: ['faq']
		});
	}

	async exec(message: Message): Promise<Message> {
		const embed = new MessageEmbed({ color: palette.warning }),
			questions: Array<{ q: string; a: string }> = [
				{
					q: "Qu'est-ce que, techniquement, on peut faire avec le cookie ?",
					a: "Grâce au cookie de session, il est possible de littéralement tout faire sur votre compte Pepal. Cela inclut mais n'est pas limité à : voir votre adresse personnelle, adresse mail, numéro de téléphone, adresse SDV et **changer le mot de passe**."
				},
				{
					q: "Qu'est-ce que le bot fait de mon cookie de session ?",
					a: 'Le cookie est gardé **chiffré** dans une base de données et utilisé pour accéder **seulement** aux pages suivantes : `?my=notes`'
				},
				{
					q: "Comment puis-je avoir la certitude que mon cookie ne sera pas utilisé à d'autres fins, comme changer mon mot de passe ?",
					a: 'Si ça peut vous rassurer, le bot est totalement **[open-source](https://github.com/Reydux/pepal-bot)**. De ce fait, il est possible que ce bot soit un fork utilisé à mauvais escient, vérifiez que son nom est `Pepal - Dev#4666` et que son ID est `926894160265490463`.'
				}
			];

		for (const question of questions.values())
			embed.addField(question.q, question.a, false);

		await message.reply({ embeds: [embed] });
		return message;
	}
}
