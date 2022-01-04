import { Command } from 'discord-akairo';
import Pepal from '../structure/pepal';
import { Message } from 'discord.js';

// -------------------------------------------------- \\

export default class TimeTableCommand extends Command {
	constructor() {
		super('timetable', {
			aliases: ['edt', 'emploi']
		});
	}

	async exec(message: Message): Promise<Message> {
		const pepal = await Pepal.init(message.author.id);
		await pepal.getTimeTable();
		return message;
	}
}
