const axios = require('axios');
const fs = require('fs-extra');
const pLimit = require('p-limit').default;

const parseNop = require('../utils/parseNop');
const buildGisId = require('../utils/buildGis');

const limit = pLimit(5);
const OUTPUT = 'output/hasil-cek-nop.txt';

/** TOKEN EPBB (INTERNAL) */
const AUTH = {
	token:
		'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2VwYmIuYmluamFpa290YS5nby5pZC9zZXJ2aWNlL2FwaS9hdXRoL2xvZ2luIiwiaWF0IjoxNzY1ODU4Mjg1LCJleHAiOjE3NjU4NjE4ODUsIm5iZiI6MTc2NTg1ODI4NSwianRpIjoiRmtweWdnbEVid0N1Q1VkayIsInN1YiI6IjEwIiwicHJ2IjoiYjkxMjc5OTc4ZjExYWE3YmM1NjcwNDg3ZmZmMDFlMjI4MjUzZmU0OCJ9.gqISsgJwJGNZdTcjjtpeJ9W31F_25SYsWPJuEWVYt3k',
	signature: 'OTllNDg4YTAtOGMzZi00YTI4LWJjMTEtNjBiY2I0OTVmMWU1',
};

async function cekEPBB({ kec, kel, blok, urut, status }) {
	const url = `https://epbb.binjaikota.go.id/service/api/smartgis/search/data/${kec}/${kel}/${blok}/${urut}/${status}`;

	try {
		const res = await axios.get(url, {
			timeout: 15000,
			headers: {
				Authorization: `Bearer ${AUTH.token}`,
				signature: AUTH.signature,
			},
		});

		return res.data?.status === true ? res.data.data : null;
	} catch {
		return null;
	}
}

async function cekSmartGIS(gisId) {
	const url = `https://smartgis.infotekmetrodata.co.id/api/geo/village/lands/${gisId}`;

	try {
		const res = await axios.get(url, { timeout: 15000 });
		return res.data ? true : false;
	} catch {
		return false;
	}
}

async function cekNOP(nop) {
	const parsed = parseNop(nop);
	const gisId = buildGisId(nop);

	const epbb = await cekEPBB(parsed);
	const gis = await cekSmartGIS(gisId);

	if (epbb && gis) {
		return `
NOP: ${nop}
STATUS_PAJAK: ADA
STATUS_GIS: ADA
KESIMPULAN: TAMPIL DI WEBSITE
NAMA: ${epbb.nama}
TAHUN: ${epbb.tahun}
TAGIHAN: ${epbb.tagihan}
----------------------------------------
`;
	}

	if (epbb && !gis) {
		return `
NOP: ${nop}
STATUS_PAJAK: ADA
STATUS_GIS: TIDAK ADA
KESIMPULAN: DATA PAJAK ADA, BELUM TERPETAKAN (TIDAK TAMPIL DI WEBSITE)
----------------------------------------
`;
	}

	return `
NOP: ${nop}
STATUS_PAJAK: TIDAK ADA
STATUS_GIS: TIDAK ADA
KESIMPULAN: DATA TIDAK DITEMUKAN
----------------------------------------
`;
}

async function prosesSemuaNOP(nopList) {
	await fs.ensureDir('output');
	await fs.writeFile(OUTPUT, '');

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
