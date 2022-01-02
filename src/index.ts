import Client from './structure/client';
import { config } from 'dotenv';
config();

// -------------------------------------------------- \\

if (
	!process.env.DISCORD_TOKEN ||
	!process.env.DB_HOST ||
	!process.env.DB_PORT ||
	!process.env.DB_USERNAME ||
	!process.env.DB_PASSWORD ||
	!process.env.DB_NAME
)
	throw new Error(
		"Les environment variables n'ont pas étés correctement définies."
	);

const discordClient = new Client({ token: process.env.DISCORD_TOKEN });
void discordClient.start();

process.on('uncaughtException', (error) => {
	console.log('Je suis passé par process.on');
	console.log(error);
	console.log();
});
