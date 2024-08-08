// api/extract.js

import multiparty from 'multiparty';
import fs from 'fs';
import { ZipReader, Uint8ArrayReader } from '@zip.js/zip.js'; // Adjust the path if needed

const readFileAsync = (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
};

const PASSWORD = 'X'; // Replace 'X' with your actual password

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
        // Read the file content as a buffer
        const fileBuffer = await readFileAsync(file.path);

        // Initialize the ZipReader
        const zipReader = new ZipReader(new Uint8ArrayReader(fileBuffer));

        // Get all entries from the ZIP file
        const entries = await zipReader.getEntries();
        const entry = entries[0]; // Assuming you want to process the first entry

        if (entry) {
          // Extract the file data
          const fileData = await entry.getData(new Uint8Array());
          const encodedFileData = Buffer.from(fileData).toString('base64');

          res.json({
            fileName: entry.filename,
            hardcoed: "gigelium",
            incaCeva: "boohohoho",
            tip: encodedFileData
          });
        } else {
          res.status(400).json({ error: 'No valid entries found in the ZIP file' });
        }
      } catch (error) {
        console.error('Error processing file:', error.message);
        res.status(500).json({ error: 'Failed to process file', details: error.message });
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
