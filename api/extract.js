// api/extract.js

import multiparty from 'multiparty';
import fs from 'fs';
import yauzl from 'yauzl';
import { promisify } from 'util';

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
        // Open the ZIP file using yauzl
        yauzl.open(file.path, { lazyEntries: true, password: PASSWORD }, (err, zipFile) => {
          if (err) {
            console.error('Error opening ZIP file:', err.message);
            return res.status(500).json({ error: 'Failed to open ZIP file', details: err.message });
          }

          // Read the first entry in the ZIP file
          zipFile.readEntry();
          zipFile.on('entry', (entry) => {
            // If the entry is a file, extract its content
            if (/\/$/.test(entry.fileName)) {
              zipFile.readEntry(); // Skip directories
            } else {
              zipFile.openReadStream(entry, (err, readStream) => {
                if (err) {
                  console.error('Error reading entry stream:', err.message);
                  return res.status(500).json({ error: 'Failed to read file stream', details: err.message });
                }

                const chunks = [];
                readStream.on('data', (chunk) => {
                  chunks.push(chunk);
                });

                readStream.on('end', () => {
                  const fileContent = Buffer.concat(chunks).toString('utf-8');
                  res.json({ fileName: entry.fileName, content: fileContent });
                  zipFile.close();
                });

                readStream.on('error', (err) => {
                  console.error('Error processing file stream:', err.message);
                  return res.status(500).json({ error: 'Failed to process file stream', details: err.message });
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
