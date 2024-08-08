// api/extract.js

import AdmZip from 'adm-zip';

const PASSWORD = 'X'; // Replace with your actual password

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const data = await getRawBody(req);
      const zip = new AdmZip(data);

      // Assuming there's only one file in the ZIP
      const zipEntries = zip.getEntries();
      if (zipEntries.length === 0) {
        return res.status(400).json({ error: 'No files in the ZIP archive' });
      }

      const zipEntry = zipEntries[0]; // Get the first file
      const fileName = zipEntry.entryName;
      const fileData = zipEntry.getData().toString('utf8');

      res.json({
        fileName,
        fileData,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process ZIP file' });
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
