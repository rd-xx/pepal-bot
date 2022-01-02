import { AkairoClient, ListenerHandler } from 'discord-akairo';
import { Connection, createConnection } from 'typeorm';
import { join } from 'path';

// -------------------------------------------------- \\

export default class Client extends AkairoClient {
	#config: BotOptions;
	db?: Connection;

	// --------------- \\

	listenerHandler = new ListenerHandler(this, {
		directory: join(__dirname, '..', 'listeners')
	});

	// --------------- \\

	constructor(config: BotOptions) {
		super({
			intents: [
				'DIRECT_MESSAGES',
				'GUILDS',
				'GUILD_MESSAGES',
				'GUILD_INTEGRATIONS'
			],
			partials: ['CHANNEL'],
			presence: { status: 'dnd' },
			ownerID: config.developers
		});

		this.#config = config;
	}

	// --------------- \\

	private async init(): Promise<void> {
		this.listenerHandler.setEmitters({
			listenerHandler: this.listenerHandler,
			process
		});

		const connection = await createConnection({
			type: 'postgres',
			host: process.env.DB_HOST,
			port: Number(process.env.DB_PORT),
			username: process.env.DB_USERNAME,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_NAME,
			// ##### \\
			cache: true
		});
		await connection.close();
		await connection.connect();
		await connection
			.query('SELECT id FROM guilds;')
			.catch(async () => await connection.synchronize());

		this.listenerHandler.loadAll();
		this.db = connection;
	}

	// --------------- \\

	async start(): Promise<string> {
		await this.init();
		return this.login(this.#config.token);
	}
}

// -------------------------------------------------- \\

interface BotOptions {
	token?: string;
	developers?: string | string[];
}
