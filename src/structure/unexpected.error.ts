export default class UnexpectedError extends Error {
	constructor(message: string) {
		super("Une erreur inespérée s'est produite. " + message);
	}
}
