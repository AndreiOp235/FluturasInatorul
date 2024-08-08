// api/extract.js

import multiparty from 'multiparty';
import AdmZip from 'adm-zip';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const form = new multiparty.Form();

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Error parsing form data:', err);
        return res.status(500).json({ error: 'Failed to parse form data' });
      }

      // Get the uploaded file
      const file = files.file?.[0];

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      try {
        // Read the file data as a buffer
        const fileBuffer = file ? file.buffer : null;

        if (!fileBuffer) {
          return res.status(400).json({ error: 'Failed to read uploaded file' });
        }

        // Initialize AdmZip with the file buffer
        const zip = new AdmZip(fileBuffer);

        // Get all entries in the ZIP file
        const zipEntries = zip.getEntries();

        // If there are no files, return an error
        if (zipEntries.length === 0) {
          return res.status(400).json({ error: 'No files in the ZIP archive' });
        }

        // Get the name of the first file
        const firstFileName = zipEntries[0].entryName;

        // Return the file name
        res.json({ fileName: firstFileName });
      } catch (error) {
        console.error('Error processing ZIP file:', error.message);
        res.status(500).json({ error: 'Failed to process ZIP file', details: error.message });
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
