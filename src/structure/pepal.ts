import { parse, HTMLElement } from 'node-html-parser';
import { makeRequest } from '../utils/https.helper';
import UserEntity from '../database/user.entity';
import UnexpectedError from './unexpected.error';
import { format } from 'tsuki-utilities';
import { getConnection } from 'typeorm';
import { DateTime } from 'luxon';

// -------------------------------------------------- \\

export default class Pepal {
	discordId: string;
	name?: string;
	class?: string;
	#cookie?: string;

	disciplines: Array<{ name: string; coefficient: number }> = [];
	grades: Array<{
		discipline: string;
		title: string;
		date: Date;
		grade: number;
		comment: string | null;
	}> = [];

	/**
	 * Constructeur. Fonction appelée automatiquement à chaque initialisation de la classe.
	 * @param discordId Id discord de l'utilisateur.
	 */
	private constructor(discordId: string) {
		this.discordId = discordId;
	}

	/**
	 * Véritable fonction d'initialisation. Le constructeur ne pouvait pas être utilisé car il n'accepte pas les fonctions async.
	 * @param discordId Id discord de l'utilisateur.
	 * @param cookie Cookie de l'utilisateur.
	 * @param fromLogin Si la fonction est exécutée depuis la commande 'login'.
	 */
	static async init(
		discordId: string,
		cookie?: string,
		fromLogin = false
	): Promise<Pepal> {
		const thisClass = new Pepal(discordId);

		if (!fromLogin)
			if (cookie) await thisClass.saveCookie(cookie);
			else await thisClass.setCookie();

		return thisClass;
	}

	/**
	 * Fonction utilisée pour sauvegarder le cookie dans la base de données.
	 * @param cookie Cookie de l'utilisateur.
	 */
	async saveCookie(cookie: string): Promise<boolean> {
		const userRepo = getConnection().getRepository(UserEntity),
			user =
				(await userRepo.findOne({ discordId: this.discordId })) ||
				new UserEntity(),
			inserted = user.id === undefined;

		user.discordId = this.discordId;
		user.ppCookie = cookie;
		await userRepo.save(user);

		return inserted;
	}

	/**
	 * Définit le cookie de la classe par rapport au cookie stocké dans la base de données.
	 */
	async setCookie(): Promise<Pepal> {
		const user = await getConnection()
			.getRepository(UserEntity)
			.findOne({ discordId: this.discordId });

		if (!user)
			throw new UnexpectedError(
				"Il paraît que l'utilisateur n'a pas été enregistré dans la base de données."
			);

		this.#cookie = user.ppCookie;
		console.log(user.ppCookie);
		return this;
	}

	/**
	 * Cette fonction est exécutée dans toutes les fonctions intéragissant avec une page Pepal pour (re)définir les informations de l'utilisateur, présents dans toutes les pages.
	 * @param parsedHtml Quelconque page HTML de Pepal.
	 */
	private async setUserInfos(parsedHtml: HTMLElement): Promise<Pepal> {
		const userName = parsedHtml.querySelector('.username'),
			userClass = parsedHtml.querySelector('a[href*="/agora/room"]');

		if (!userName || !userClass)
			throw new UnexpectedError('Le web parsing a échoué.');

		this.name = format(userName.text);
		this.class = format(userClass.text.replace('Agora', ''));

		return this;
	}

	/**
	 * Fonction utilisée pour récupérer toutes les matières et notes de l'utilisateur.
	 * @param cookie Cookie spéficique. Paramètre utilisé seulement dans le cas de la commande 'login'.
	 */
	async getGrades(cookie?: string): Promise<Pepal> {
		if (!cookie && !this.#cookie)
			throw new UnexpectedError("Je n'ai aucun cookie à utiliser.");

		const rawHtml =
				(await makeRequest(
					(cookie as string) || (this.#cookie as string),
					'?my=notes'
				)) + '',
			parsedHtml = parse(rawHtml),
			htmlTable = parsedHtml.querySelector('.table-bordered');

		if (!htmlTable) throw new UnexpectedError('Le web parsing a échoué.');

		this.setUserInfos(parsedHtml);

		const gradesTable = htmlTable.childNodes[3].childNodes.filter(
			(_) => format(_.text) && format(_.textContent)
		);
		for (const [i, child] of gradesTable.entries()) {
			const element = child as HTMLElement,
				className = element.attrs.class;

			// --------------- \\

			if (['warning', 'info'].includes(className)) {
				const discipline = element.childNodes.filter((_) => format(_.text));
				this.disciplines.push({
					name: format(discipline[0].text),
					coefficient: Number(discipline[1].text)
				});
			} else if (className === 'note_devoir') {
				let disciplineName: string | undefined;
				for (let u = i; u >= 0; u--) {
					const previousElement = gradesTable[u] as HTMLElement;

					if (['warning', 'info'].includes(previousElement.attrs.class)) {
						disciplineName = format(
							previousElement.childNodes.filter((_) => format(_.text))[0].text
						);
						break;
					}
				}

				let comment: string | null = null;
				const nextElement = gradesTable[i + 1] as HTMLElement;
				if (nextElement && !nextElement.attrs.class && nextElement.text)
					comment = format(nextElement.text);

				if (!disciplineName)
					throw new UnexpectedError('Le web parsing a échoué.');

				const infos = element.childNodes.filter((_) => format(_.text));
				this.grades.push({
					discipline: disciplineName,
					title: format(infos[0].text.replace('PUBLIE', '')),
					date: DateTime.fromFormat(format(infos[1].text), 'cccc dd LLL yyyy', {
						locale: 'fr'
					}).toJSDate(),
					grade: Number(infos[2].text),
					comment
				});
			}
		}

		return this;
	}
}
