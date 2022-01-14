import { Listener, Command } from 'discord-akairo';
import { Message } from 'discord.js';

// -------------------------------------------------- \\

export default class CommandBlockedListener extends Listener {
	constructor() {
		super('blocked', {
			emitter: 'commandHandler',
			event: 'commandBlocked'
		});
	}

	async exec(
		message: Message,
		command: Command,
		reason: string
	): Promise<void> {
		if (reason === 'dm')
			await message.reply({
				content: 'Veuillez exécuter cette commande en privé.',
				allowedMentions: {
					repliedUser: false
				}
			});
	}
}
