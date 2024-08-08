// api/extract.js

export default async function handler(req, res) {
    if (req.method === 'POST') {
      try {
        // Get the file from the multipart/form-data request
        const data = await getRawBody(req);
        const fileName = extractFileNameFromMultipart(data);
  
        // Return the file name
        res.json({ fileName });
      } catch (error) {
        res.status(500).json({ error: 'Failed to process request' });
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
  
  // Helper function to extract file name from multipart data
  function extractFileNameFromMultipart(data) {
    const boundary = '--boundary'; // Hardcoded boundary; adjust as needed
    const parts = data.toString().split(boundary);
    
    for (let part of parts) {
      if (part.includes('Content-Disposition:')) {
        const contentDisposition = part.split('Content-Disposition:')[1];
        const fileNameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (fileNameMatch) {
          return fileNameMatch[1];
        }
      }
    }
  
    return 'Unknown';
  }
  