const express = require('express');
const prosesSemuaNOP = require('./services/nop.service');
const nopList = require('./data/datanop');

const app = express();
const PORT = 3000;

app.get('/run', async (req, res) => {
	try {
		prosesSemuaNOP(nopList); // background process
		res.json({
			status: true,
			message: 'Proses cek NOP dimulai. Silakan cek folder output.',
		});
	} catch (err) {
		res.status(500).json({
			status: false,
			message: err.message,
		});
	}
});

app.listen(PORT, () => {
	console.log(`Server running di http://localhost:${PORT}`);
});
