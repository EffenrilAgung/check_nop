const express = require('express');
const prosesSemuaNOP = require('./services/nop.service');
const nopList = require('./data/datanop.js');

const app = express();
const PORT = 3000;

app.get('/run', async (req, res) => {
	prosesSemuaNOP(nopList);
	res.json({
		status: true,
		message: 'Proses cek dimulai. Lihat output/hasil-cek-nop.txt',
	});
});

app.listen(PORT, () => console.log(`Server running http://localhost:${PORT}`));
