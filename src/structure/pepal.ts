import { parse, HTMLElement } from 'node-html-parser';
import { format } from 'tsuki-utilities';
import { makeRequest } from '../utils/https.helper';

export default class Pepal {
	#cookie: string;

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

	async getGrades(): Promise<void> {
		const rawHtml = (await makeRequest(this.#cookie, '?my=notes')) + '',
			rawHtmlTable = parse(rawHtml).querySelector('.table-bordered');

		if (!rawHtmlTable)
			throw new Error(
				"Une erreur inespérée s'est produite. Je n'ai pas trouvé la table des notes."
			);

		const gradesTable = rawHtmlTable.childNodes[3].childNodes.filter(
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
					throw new Error(
						"Une erreur inespérée s'est produite. Le web parsing a échoué."
					);

				const infos = element.childNodes.filter((_) => format(_.text));
				this.grades.push({
					discipline: disciplineName,
					title: format(infos[0].text.replace('PUBLIE', '')),
					date: format(infos[1].text) as unknown as Date, // WIP
					grade: Number(infos[2].text),
					comment
				});
			}
		}
	}
}
