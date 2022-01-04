import { parse, HTMLElement } from 'node-html-parser';
import { makeRequest } from '../utils/https.helper';
import { format } from 'tsuki-utilities';
import { DateTime } from 'luxon';

// -------------------------------------------------- \\

export default class Pepal {
	#cookie: string;

	name: string | undefined;
	class: string | undefined;

	disciplines: Array<{ name: string; coefficient: number }> = [];
	grades: Array<{
		discipline: string;
		title: string;
		date: Date;
		grade: number;
		comment: string | null;
	}> = [];

	constructor(cookie: string) {
		this.#cookie = cookie;
	}

	private setUserInfos(parsedHtml: HTMLElement) {
		const userName = parsedHtml.querySelector('.username'),
			userClass = parsedHtml.querySelector('a[href*="/agora/room"]');

		if (!userName || !userClass)
			throw new UnexpectedError('Le web parsing a échoué.');

		this.name = format(userName.text);
		this.class = format(userClass.text.replace('Agora', ''));
	}

	async getGrades(): Promise<void> {
		const rawHtml = (await makeRequest(this.#cookie, '?my=notes')) + '',
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
	}
}
