// api/extract.js

import multiparty from 'multiparty';
import fs from 'fs';
import yauzl from 'yauzl';

const PASSWORD = 'X'; // Replace 'X' with your actual password

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const form = new multiparty.Form();

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Error parsing form data:', err);
        return res.status(500).json({ error: 'Failed to parse form data' });
      }

      const file = files.file?.[0];

      if (!file || !file.path) {
        return res.status(400).json({ error: 'No file uploaded or failed to read file path' });
      }

      try {
        yauzl.open(file.path, { lazyEntries: true, password: PASSWORD, decrypt: true }, (err, zipFile) => {
          if (err) {
            console.error('Error opening ZIP file:', err.message);
            return res.status(500).json({ error: 'Failed to open ZIP file', details: err.message });
          }

          zipFile.readEntry();

          zipFile.on('entry', (entry) => {
            if (/\/$/.test(entry.fileName)) {
              zipFile.readEntry(); // Skip directories
            } else {
              zipFile.openReadStream(entry, (err, readStream) => {
                if (err) {
                  console.error('Error opening read stream for entry:', err.message);
                  return res.status(500).json({ error: 'Failed to open read stream for entry', details: err.message });
                }

                // Set response headers for file download
                res.setHeader('Content-Disposition', `attachment; filename=${entry.fileName}`);
                res.setHeader('Content-Type', 'application/octet-stream');

                // Pipe the read stream to the response
                readStream.pipe(res);

                // Close the ZIP file after streaming the entry
                readStream.on('end', () => {
                  zipFile.close();
                });
              });
            }
          });

          zipFile.on('end', () => {
            zipFile.close();
          });

          zipFile.on('error', (err) => {
            console.error('Error processing ZIP file:', err.message);
            return res.status(500).json({ error: 'Failed to process ZIP file', details: err.message });
          });
        });
      } catch (error) {
        console.error('Error processing file:', error.message);
        res.status(500).json({ error: 'Failed to process file', details: error.message });
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
