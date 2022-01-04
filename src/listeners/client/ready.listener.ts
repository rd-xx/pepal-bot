import CrawlerClient from '../../structure/client';
import { Listener } from 'discord-akairo';
import { readFileSync } from 'fs';
import { join } from 'path';

// -------------------------------------------------- \\

export default class ReadyListener extends Listener {
	constructor() {
		super('ready', {
			emitter: 'client',
			event: 'ready'
		});
	}

	async exec(client: CrawlerClient): Promise<void> {
		const botVersion: number = JSON.parse(
			readFileSync(
				join(__dirname, '..', '..', 'package.json')
			) as unknown as string
		).version;

		console.log(`pepal-bot —`, botVersion);
		console.log(`Connecté au compte: ${client.user?.tag}\n`);
	}
}
