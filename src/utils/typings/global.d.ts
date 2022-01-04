/**
 * Typings globaux pour l'autocomplete.
 */
declare global {
	namespace NodeJS {
		interface ProcessEnv {
			ENVIRONMENT: string | 'dev' | 'prod';
			DISCORD_TOKEN: string;

			DB_HOST: string | 'db';
			DB_PORT: string;
			DB_USERNAME: string;
			DB_PASSWORD: string;
			DB_NAME: string;

			CRYPTO_KEY: string;
		}
	}
}

export {};
