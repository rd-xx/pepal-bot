import { Command, Listener } from 'discord-akairo';
import { Message } from 'discord.js';

// -------------------------------------------------- \\

export default class CommandErrorListener extends Listener {
	constructor() {
		super('error', {
			emitter: 'commandHandler',
			event: 'error'
		});
	}

	// --------------- \\

	async exec(
		error: unknown,
		message: Message,
		command?: Command
	): Promise<void> {
		let errorMsg: string | undefined;
		if (error instanceof Error) errorMsg = error.message;
		else errorMsg = "Une erreur inespérée s'est produite.";

		// --------------- \\

		if (command) await message.reply(errorMsg);
	}
}
