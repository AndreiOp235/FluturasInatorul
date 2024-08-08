// api/extract.js

import multiparty from 'multiparty';
import fs from 'fs';
import { Readable } from 'stream';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';

const PASSWORD = '1720618040028'; // Replace 'X' with your actual password

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
        // Open the PDF file using pdf-lib
        const fileBuffer = fs.readFileSync(file.path);
        const pdfDoc = await PDFDocument.load(fileBuffer);
        
        // Convert the first page to PNG
        const firstPage = pdfDoc.getPages()[0];
        const pdfPageBuffer = await firstPage.render({
          scale: 2, // Adjust the scale as needed
        });

        const pngBuffer = await sharp(pdfPageBuffer).toBuffer();

        // Convert PNG buffer to base64
        const base64Image = pngBuffer.toString('base64');

        res.json({
          fileName: file.originalFilename,
          imageBase64: base64Image
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
