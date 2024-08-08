// api/extract.js

import multiparty from 'multiparty';
import fs from 'fs';
import yauzl from 'yauzl';
import { promisify } from 'util';

const PASSWORD = 'X'; // Replace 'X' with your actual password

// Promisify fs.stat for easier async/await usage
const stat = promisify(fs.stat);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const form = new multiparty.Form();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form data:', err);
        return res.status(500).json({ error: 'Failed to parse form data' });
      }

      const file = files.file?.[0];

      if (!file || !file.path) {
        return res.status(400).json({ error: 'No file uploaded or failed to read file path' });
      }

      // Log the file details for debugging
      console.log(`Received file: ${file.originalFilename}`);
      try {
        const stats = await stat(file.path);
        console.log(`File size: ${stats.size} bytes`);

        yauzl.open(file.path, { lazyEntries: true, password: PASSWORD, decrypt: true }, (err, zipFile) => {
          if (err) {
            console.error('Error opening ZIP file:', err.message);
            return res.status(500).json({ error: 'Failed to open ZIP file', details: err.message });
          }

          let entryProcessed = false;
          zipFile.on('entry', (entry) => {
            if (/\/$/.test(entry.fileName)) {
              zipFile.readEntry(); // Skip directories
            } else if (!entryProcessed) {
              entryProcessed = true;
              
              // Extract metadata from the single file entry
              const metadata = {
                fileName: entry.fileName
              };

              res.json(metadata);
              zipFile.close(); // Close the ZIP file after processing
            }
          });

          zipFile.on('end', () => {
            if (!entryProcessed) {
              res.status(404).json({ error: 'No file found in ZIP archive' });
            }
          });

          zipFile.on('error', (err) => {
            console.error('Error processing ZIP file:', err.message);
            return res.status(500).json({ error: 'Failed to process ZIP file', details: err.message });
          });
        });
      } catch (error) {
        console.error('Error reading file stats:', error.message);
        res.status(500).json({ error: 'Failed to read file stats', details: error.message });
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
