// api/extract.js

import multiparty from 'multiparty';
import fs from 'fs';

function bufferToHex(buffer) {
  return Array.from(buffer)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

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
        // Read the file content as a buffer
        const fileBuffer = fs.readFileSync(file.path);

        // Convert the buffer to a hexdump
        const hexDump = bufferToHex(fileBuffer);

        // Respond with the hexdump in JSON
        res.json({
          fileName: file.originalFilename,
          hexDump: hexDump
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
