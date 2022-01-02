import { request } from 'https';

// -------------------------------------------------- \\

export async function makeRequest(
	cookie: string,
	path: string
): Promise<unknown> {
	let responsePayload = '';
	return await new Promise(async (resolve, reject) => {
		const req = request(
			{
				hostname: 'www.pepal.eu',
				path: '/' + path,
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.55 Safari/537.36 Edg/96.0.1054.34',
					Cookie: `sdv=${cookie}`
				}
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
						reject(`Deu erro ao tentar adquirir a página ${path}`);
					}
				});
			}
		);

		req.end();
	});
}
