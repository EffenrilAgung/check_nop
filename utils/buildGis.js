module.exports = function buildGisId(nop) {
	// buang titik → jadi numeric GIS ID
	return nop.replace(/\./g, '');
};
