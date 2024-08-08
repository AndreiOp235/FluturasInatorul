// api/extract.js

import AdmZip from 'adm-zip';

const PASSWORD = 'yourpassword'; // Replace with your actual password

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const data = await getRawBody(req);
      const zip = new AdmZip(data);

      // Get all entries in the ZIP file
      const zipEntries = zip.getEntries();
      
      // If there are no files, return an error
      if (zipEntries.length === 0) {
        return res.status(400).json({ error: 'No files in the ZIP archive' });
      }

      // Get the first entry and return its name
      const firstFileName = zipEntries[0].entryName;
      
      res.json({ fileName: firstFileName });
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
