import UnexpectedError from '../../structure/unexpected.error';
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
		if (error instanceof UnexpectedError) errorMsg = error.message;
		else errorMsg = "Une erreur inespérée s'est produite.";

		console.log(error);

		// --------------- \\

		if (command) await message.reply(errorMsg);
	}
}
