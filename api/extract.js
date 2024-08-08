// api/extract.js

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Get the raw body data from the request
      const data = await getRawBody(req);

      // Log raw data size for debugging
      console.log(`Raw data size: ${data.length}`);

      // Generate a hexdump of the first 64 bytes for debugging
      const hexdump = data.toString('hex').match(/.{1,32}/g).join('\n');

      // Return the hexdump in the response
      res.status(200).json({ hexdump });
    } catch (error) {
      // Log the error message for debugging
      console.error('Error processing file:', error.message);
      res.status(500).json({ error: 'Failed to process file', details: error.message });
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
