import { Message, MessageEmbed } from 'discord.js';
import UserEntity from '../database/user.entity';
import { Command } from 'discord-akairo';
import { getConnection } from 'typeorm';
import Pepal from '../structure/pepal';

export default class LoginCommand extends Command {
	constructor() {
		super('login', {
			aliases: ['login'],
			args: [
				{
					id: 'cookie',
					prompt: {
						start: {
							embeds: [
								new MessageEmbed({
									title: 'Comment lier son compte Pepal au bot',
									description: `1. Se connecter à Pepal normalement, **sur PC**.
					2. Ouvrir le DevTools avec **F12** ou alors **CTRL + Shift + I**.
					3. Sélectionner l'onglet **Console** dans le DevTools.
					4. Copier \`console.log(document.cookie.split("=")[1])\` et le coller dans le DevTools, appuyer ensuite sur Entrer pour l'éxécuter.
					5. Copier/coller ici dans le tchat **exactement** ce qui s'est affiché après avoir exécuté la commande.
					
					**Il est vraiment recommandé d'exécuter la commande *faq avant de poursuivre.**`
								})
							]
						}
					}
				}
			]
		});
	}

	async exec(
		message: Message,
		{ cookie }: { cookie: string }
	): Promise<Message> {
		const pepal = new Pepal(cookie);

		try {
			await pepal.getGrades();
		} catch {
			return message.reply(
				"Je n'ai pas réussi à utiliser le cookie. Il n'est donc pas valable."
			);
		}

		const userRepo = getConnection().getRepository(UserEntity),
			authorId = message.author.id,
			user =
				(await userRepo.findOne({ discordId: authorId })) || new UserEntity();

		user.discordId = authorId;
		user.ppCookie = cookie;

		await userRepo.save(user);
		return message.reply(
			user.id
				? "C'est noté, votre cookie a bien été actualisé."
				: `Bienvenue, **${pepal.name}**. Votre cookie a été sauvegardé de mon côté et sera utilisé lors de chaque utilisation du bot.`
		);
	}
}
