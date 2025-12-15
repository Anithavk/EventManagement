const QRCode = require('qrcode');

async function generateQRCode(text) {
  return QRCode.toDataURL(text);
}

module.exports = { generateQRCode };
