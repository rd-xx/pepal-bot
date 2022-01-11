import { request } from 'https';

// -------------------------------------------------- \\

/**
 * Fonction pour acquérir une page HTML de Pepal.
 * Il serait plus simple d'utiliser une bibliothèque comme Axios pour ce genre d'opération,
 * mais je voulais limiter les dépendances au maximum.
 * @param cookie Cookie de l'utilisateur.
 * @param path Chemin de la page de Pepal.
 */
export async function makeRequest(
	cookie: string,
	path: string,
	body?: string
): Promise<unknown> {
	const headers = {
		'User-Agent':
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.55 Safari/537.36 Edg/96.0.1054.34',
		Cookie: `sdv=${cookie}`
	};
	if (body)
		Object.assign(headers, {
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
		});

	let responsePayload = '';
	return await new Promise(async (resolve, reject) => {
		const req = request(
			{
				hostname: 'www.pepal.eu',
				path: '/' + path,
				headers,
				method: body ? 'POST' : 'GET'
			},
			(response) => {
				response.on('data', (data) => {
					responsePayload += data;
				});

				response.on('end', () => {
					if (response.statusCode && response.statusCode < 300)
						resolve(responsePayload);
					else {
						console.log(response, responsePayload);
						reject(
							`Une erreur est survenue lors de l'obtention de la page ${path}`
						);
					}
				});
			}
		);

		if (body) req.write(body);
		req.end();
	});
}
