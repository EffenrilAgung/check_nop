function parseNop(nop) {
	const parts = nop.split('.');

	if (parts.length !== 7) {
		throw new Error(`Format NOP tidak valid: ${nop}`);
	}

	return {
		kec: parts[2],
		kel: parts[3],
		blok: parts[4],
		urut: parts[5],
		status: parts[6],
	};
}

module.exports = parseNop;
