// api/extract.js

import multiparty from 'multiparty';
import fs from 'fs';
import StreamZip from 'node-stream-zip';

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
        // Initialize node-stream-zip with the uploaded file and password
        const zip = new StreamZip.async({ file: file.path, password: PASSWORD });

        zip.on('error', (err) => {
          console.error('Error opening ZIP file:', err.message);
          return res.status(500).json({ error: 'Failed to open ZIP file', details: err.message });
        });

        // Get the entries (files) in the ZIP archive
        const entries = await zip.entries();

        // Find the first file entry
        const firstEntry = Object.values(entries).find(entry => !entry.isDirectory);

        if (!firstEntry) {
          return res.status(400).json({ error: 'No files found in the ZIP archive' });
        }

        // Stream the file content to the response
        res.setHeader('Content-Disposition', `attachment; filename="${firstEntry.name}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        const stream = await zip.stream(firstEntry.name);
        stream.pipe(res);

        stream.on('end', async () => {
          await zip.close();
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
