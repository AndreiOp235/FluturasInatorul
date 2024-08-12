// api/extract.js

import multiparty from 'multiparty';
import fs from 'fs';
import { BlobReader, ZipReader, Data64URIWriter } from '@zip.js/zip.js';
import pdfToPng from 'pdf-to-png-converter';

const DEFAULT_PASSWORD = 'X'; // Default password for backward compatibility

async function convertPdfToPng(base64Pdf) {
  // Convert base64 PDF to a buffer
  const pdfBuffer = Buffer.from(base64Pdf, 'base64');

  // Use pdf-to-png-converter to convert the buffer to a PNG buffer
  const pngBuffer = await pdfToPng.convertBufferToBuffer(pdfBuffer);

  // Convert PNG buffer to base64
  const base64Png = pngBuffer.toString('base64');

  return base64Png;
}

export default async function handler(req, res) {
  if (req.method === 'POST') { 
    const form = new multiparty.Form();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form data:', err);
        return res.status(500).json({ error: 'Failed to parse form data' });
      }

      const file = files.file?.[0];
      const password = fields.password?.[0] || DEFAULT_PASSWORD; // Use provided password or fallback to default

      if (!file || !file.path) {
        return res.status(400).json({ error: 'No file uploaded or failed to read file path' });
      }

      try {
        // Read the uploaded ZIP file into a buffer
        const fileBuffer = fs.readFileSync(file.path);
        const blob = new Blob([fileBuffer]);

        // Create a ZipReader instance to read the ZIP file
        const zipReader = new ZipReader(new BlobReader(blob), { password });

        // Get entries from the ZIP file
        const entries = await zipReader.getEntries(); 

        if (entries.length === 0) {
          return res.status(400).json({ error: 'No files found in the ZIP archive' });
        }

        // Extract the first file
        const firstEntry = entries[0];
        const fileContent = await firstEntry.getData(new Data64URIWriter());

        // Remove the URI scheme prefix (data:image/png;base64,)
        const base64Data = fileContent.split(',')[1] || fileContent;

        // Call function to convert PDF to PNG
        const basePNG = await convertPdfToPng(base64Data);

        res.json(basePNG);

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
