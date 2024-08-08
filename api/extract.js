// api/extract.js

import multiparty from 'multiparty';
import fs from 'fs';
import { Minizip } from 'minizip-asm';

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

      fs.readFile(file.path, async (err, data) => {
        if (err) {
          console.error('Error reading file:', err);
          return res.status(500).json({ error: 'Failed to read file', details: err.message });
        }

        try {
          // Initialize minizip
          const minizip = new Minizip();
          await minizip.load();

          // Open the ZIP file
          const zip = minizip.open(new Uint8Array(data), PASSWORD);

          // Find the first file entry
          const entries = zip.getEntries();
          if (entries.length === 0) {
            return res.status(404).json({ error: 'No files found in the ZIP archive' });
          }

          const firstEntry = entries[0];
          const fileName = firstEntry.getName();
          const fileContent = await firstEntry.async('nodebuffer');

          // Set response headers for file download
          res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
          res.setHeader('Content-Type', 'application/octet-stream');
          res.send(fileContent);
        } catch (error) {
          console.error('Error processing ZIP file:', error.message);
          res.status(500).json({ error: 'Failed to process ZIP file', details: error.message });
        }
      });
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
