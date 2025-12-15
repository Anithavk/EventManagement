const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

async function exportRegistrationsToCSV(registrations) {
  const filename = path.join(__dirname, '..', 'exports', `registrations_${Date.now()}.csv`);
  const csvWriter = createCsvWriter({
    path: filename,
    header: Object.keys(registrations[0] || {}).map(k => ({ id: k, title: k }))
  });

  await csvWriter.writeRecords(registrations);
  return filename;
}

module.exports = { exportRegistrationsToCSV };
