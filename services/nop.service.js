const axios = require('axios');
const fs = require('fs-extra');
const pLimit = require('p-limit').default;
const parseNop = require('../utils/parseNop');

const limit = pLimit(6);
const OUTPUT = 'output/hasil-cek-nop.txt';

/**
 * SESUAIKAN TOKEN & SIGNATURE ANDA
 */
const AUTH = {
	signature: 'OTllNDg4YTAtOGMzZi00YTI4LWJjMTEtNjBiY2I0OTVmMWU1',
	token:
		'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2VwYmIuYmluamFpa290YS5nby5pZC9zZXJ2aWNlL2FwaS9hdXRoL2xvZ2luIiwiaWF0IjoxNzY1ODUzNjEwLCJleHAiOjE3NjU4NTcyMTAsIm5iZiI6MTc2NTg1MzYxMCwianRpIjoieVY3NENsd05DUEl0ak5acCIsInN1YiI6IjEwIiwicHJ2IjoiYjkxMjc5OTc4ZjExYWE3YmM1NjcwNDg3ZmZmMDFlMjI4MjUzZmU0OCJ9.6lS-DpBfv9-CZAvfHXJK8ReljSMjaSvkVjr-FRoTGWE',
};

async function cekNOP(nopString) {
	const { kec, kel, blok, urut, status } = parseNop(nopString);

	const url = `https://epbb.binjaikota.go.id/service/api/smartgis/search/data/${kec}/${kel}/${blok}/${urut}/${status}`;

	try {
		const res = await axios.get(url, {
			timeout: 15000,
			headers: {
				Authorization: `Bearer ${AUTH.token}`,
				signature: AUTH.signature,
				Accept: 'application/json',
			},
		});

		if (res.data?.status === true) {
			return `
NOP: ${res.data.data.nop}
STATUS: ADA
NAMA: ${res.data.data.nama}
TAHUN: ${res.data.data.tahun}
TAGIHAN: ${res.data.data.tagihan}
URL: ${url}
----------------------------------------
`;
		}

		return `
NOP: ${nopString}
STATUS: TIDAK ADA
URL: ${url}
----------------------------------------
`;
	} catch (err) {
		return `
NOP: ${nopString}
STATUS: ERROR
ERROR: ${err.response?.status || err.code}
URL: ${url}
----------------------------------------
`;
	}
}

async function prosesSemuaNOP(nopList) {
	await fs.ensureDir('output');
	await fs.writeFile(OUTPUT, ''); // reset file

	let count = 0;

	const tasks = nopList.map((nop) =>
		limit(async () => {
			const text = await cekNOP(nop);
			await fs.appendFile(OUTPUT, text);

			count++;
			if (count % 100 === 0) {
				console.log(`Progress ${count}/${nopList.length}`);
			}
		})
	);

	await Promise.all(tasks);
}

module.exports = prosesSemuaNOP;
