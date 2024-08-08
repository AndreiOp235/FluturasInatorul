// api/extract.js

import multiparty from 'multiparty';
import fs from 'fs';
import yauzl from 'yauzl';
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
        // Extract files from ZIP
        const extractedFiles = await extractFilesFromZip(file.path);

        // Process each extracted file
        for (const extractedFile of extractedFiles) {
          if (extractedFile.fileName.endsWith('.pdf')) {
            // Convert PDF to PNG
            const base64Image = await convertPdfToPng(extractedFile.fileBuffer);
            return res.json({
              fileName: extractedFile.fileName,
              imageBase64: base64Image
            });
          }
        }

        res.status(400).json({ error: 'No PDF files found in the ZIP archive' });

      } catch (error) {
        console.error('Error processing file:', error.message);
        res.status(500).json({ error: 'Failed to process file', details: error.message });
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Function to extract files from a ZIP archive
async function extractFilesFromZip(zipPath) {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true, password: PASSWORD }, (err, zipFile) => {
      if (err) {
        return reject(err);
      }

      const extractedFiles = [];
      zipFile.readEntry();

      zipFile.on('entry', (entry) => {
        if (/\/$/.test(entry.fileName)) {
          zipFile.readEntry(); // Skip directories
        } else {
          zipFile.openReadStream(entry, (err, stream) => {
            if (err) {
              return reject(err);
            }

            const buffers = [];
            stream.on('data', (chunk) => buffers.push(chunk));
            stream.on('end', () => {
              const fileBuffer = Buffer.concat(buffers);
              extractedFiles.push({
                fileName: entry.fileName,
                fileBuffer
              });
              zipFile.readEntry();
            });
          });
        }
      });

      zipFile.on('end', () => {
        resolve(extractedFiles);
      });

      zipFile.on('error', (err) => {
        reject(err);
      });
    });
  });
}

// Function to convert PDF to PNG
async function convertPdfToPng(pdfBuffer) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  if (pdfDoc.getPageCount() < 1) {
    throw new Error('PDF document is empty');
  }

  const firstPage = pdfDoc.getPages()[0];
  const pdfPageBuffer = await firstPage.render({
    scale: 2, // Adjust the scale as needed
  });

  const pngBuffer = await sharp(pdfPageBuffer).toBuffer();
  return pngBuffer.toString('base64');
}
