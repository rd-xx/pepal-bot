import { AkairoClient, ListenerHandler, CommandHandler } from 'discord-akairo';
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
	commandHandler = new CommandHandler(this, {
		directory: join(__dirname, '..', 'commands'),
		prefix: (): string => '*',
		commandUtil: true,
		commandUtilLifetime: 300000
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
		this.commandHandler.useListenerHandler(this.listenerHandler);
		this.listenerHandler.setEmitters({
			commandHandler: this.commandHandler
		});

		const connection = await createConnection({
			type: 'postgres',
			host: process.env.DB_HOST,
			port: Number(process.env.DB_PORT),
			username: process.env.DB_USERNAME,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_NAME,
			// ##### \\
			cache: true,
			logging: process.env.ENVIRONMENT === 'dev',
			// ##### \\
			entities: ['dist/**/*.entity.js']
		});
		await connection.close();
		await connection.connect();
		await connection
			.query('SELECT id FROM users;')
			.catch(async () => await connection.synchronize());

		this.listenerHandler.loadAll();
		this.commandHandler.loadAll();
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
