// api/extract.js

import AdmZip from 'adm-zip';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Get the raw body data from the request
      const data = await getRawBody(req);

      // Log raw data size for debugging
      console.log(`Raw data size: ${data.length}`);

      // Initialize AdmZip with the raw data
      const zip = new AdmZip(data);

      // Get all entries in the ZIP file
      const zipEntries = zip.getEntries();

      // Log number of entries for debugging
      console.log(`Number of entries: ${zipEntries.length}`);

      // If there are no files, return an error
      if (zipEntries.length === 0) {
        return res.status(400).json({ error: 'No files in the ZIP archive' });
      }

      // Get the name of the first file
      const firstFileName = zipEntries[0].entryName;

      // Return the file name
      res.json({ fileName: firstFileName });
    } catch (error) {
      // Log the error message for debugging
      console.error('Error processing ZIP file:', error.message);
      res.status(500).json({ error: 'Failed to process ZIP file', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Helper function to get raw body data from request
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
