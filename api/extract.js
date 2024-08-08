import multiparty from 'multiparty';
import fs from 'fs';
import JSZip from 'jszip';

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
          const zip = await JSZip.loadAsync(data, { password: PASSWORD });
          const firstFile = Object.keys(zip.files)[0];
          const fileContent = await zip.files[firstFile].async('nodebuffer');

          res.setHeader('Content-Disposition', `attachment; filename=${firstFile}`);
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
