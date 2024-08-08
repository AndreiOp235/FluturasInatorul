// api/extract.js

import multiparty from 'multiparty';
import fs from 'fs';
import { BlobReader, ZipReader, TextWriter } from '@zip.js/zip.js';

const PASSWORD = 'X'; // Replace with your password or pass it from the request

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

      try {
        // Read the uploaded ZIP file into a buffer
        const fileBuffer = fs.readFileSync(file.path);
        const blob = new Blob([fileBuffer]);

        // Create a ZipReader instance to read the ZIP file
        const zipReader = new ZipReader(new BlobReader(blob), { password: PASSWORD });

        // Get entries from the ZIP file
        const entries = await zipReader.getEntries();

        if (entries.length === 0) {
          return res.status(400).json({ error: 'No files found in the ZIP archive' });
        }

        // Extract the first file
        const firstEntry = entries[0];
        const fileContent = await firstEntry.getData(new TextWriter());

        // Respond with the file name and content
        res.json({
          fileName: firstEntry.filename,
          content: fileContent,
        });

        // Close the zip reader
        await zipReader.close();
      } catch (error) {
        console.error('Error processing ZIP file:', error.message);
        res.status(500).json({ error: 'Failed to process ZIP file', details: error.message });
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
