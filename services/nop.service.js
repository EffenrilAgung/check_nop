const axios = require('axios');
const fs = require('fs-extra');
const pLimit = require('p-limit').default;

const buildGisId = require('../utils/buildGis.js');

const limit = pLimit(5);

const OUTPUT_DIR = 'output';
const FILE_LENGKAP = `${OUTPUT_DIR}/lengkap.txt`;
const FILE_BELUM = `${OUTPUT_DIR}/belum_dipetakan.txt`;
const FILE_TIDAK = `${OUTPUT_DIR}/tidak_ditemukan.txt`;

async function cekSmartGIS(nop) {
	const gisId = buildGisId(nop);
	const url = `https://smartgis.infotekmetrodata.co.id/api/geo/village/lands/${gisId}`;
	const cookies = {
		signature: 'OTllNDg4YTAtOGMzZi00YTI4LWJjMTEtNjBiY2I0OTVmMWU1',
		token:
			'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2VwYmIuYmluamFpa290YS5nby5pZC9zZXJ2aWNlL2FwaS9hdXRoL2xvZ2luIiwiaWF0IjoxNzY1ODYzNDU2LCJleHAiOjE3NjU4NjcwNTYsIm5iZiI6MTc2NTg2MzQ1NiwianRpIjoidnhJSFh2Mm0zVWpVSWFtMSIsInN1YiI6IjEwIiwicHJ2IjoiYjkxMjc5OTc4ZjExYWE3YmM1NjcwNDg3ZmZmMDFlMjI4MjUzZmU0OCJ9.r189R6FYunmFGrMeudpl-qSo_gYaj3MAh9FxT8sSEuY',
	};

	try {
		const res = await axios.get(url, {
			timeout: 15000,
			headers: {
				Cookie: `signature=${cookies.signature}; token=${cookies.token}`,
			},
		});

		const features = res.data?.data?.features || [];

		if (features.length === 0) {
			return { status: 'TIDAK_ADA', geometry: false };
		}

		const hasGeometry = features.some((f) => f.geometry !== null);

		if (hasGeometry) {
			return {
				status: 'ADA',
				geometry: true,
				luas: features[0].properties?.luas || '-',
			};
		}

		return { status: 'ADA', geometry: false };
	} catch {
		return { status: 'TIDAK_ADA', geometry: false };
	}
}

function buildText(nop, result) {
	let kesimpulan = '';

	if (result.status === 'ADA' && result.geometry) {
		kesimpulan = 'LENGKAP (TAMPIL DI WEBSITE)';
	} else if (result.status === 'ADA' && !result.geometry) {
		kesimpulan = 'DATA ADA, BELUM TERPETAKAN';
	} else {
		kesimpulan = 'DATA TIDAK DITEMUKAN';
	}

	return `
NOP: ${nop}
STATUS_DATA: ${result.status === 'ADA' ? 'ADA' : 'TIDAK ADA'}
GEOMETRY: ${result.geometry ? 'ADA' : 'TIDAK ADA'}
KESIMPULAN: ${kesimpulan}
----------------------------------------
`;
}

async function prosesSemuaNOP(nopList) {
	await fs.ensureDir(OUTPUT_DIR);
	await fs.writeFile(FILE_LENGKAP, '');
	await fs.writeFile(FILE_BELUM, '');
	await fs.writeFile(FILE_TIDAK, '');

	let count = 0;

	const tasks = nopList.map((nop) =>
		limit(async () => {
			const result = await cekSmartGIS(nop);
			const text = buildText(nop, result);

			if (result.status === 'ADA' && result.geometry) {
				await fs.appendFile(FILE_LENGKAP, text);
			} else if (result.status === 'ADA' && !result.geometry) {
				await fs.appendFile(FILE_BELUM, text);
			} else {
				await fs.appendFile(FILE_TIDAK, text);
			}

			count++;
			if (count % 100 === 0) {
				console.log(`Progress ${count}/${nopList.length}`);
			}
		})
	);

	await Promise.all(tasks);
}

module.exports = prosesSemuaNOP;
