// Simple test server for local development
// Run with: node test-server.js

import { createServer } from 'http';
import { config } from 'dotenv';

// Load environment variables
config();

// Import the handler
import handler from './api/update-metafield.js';

const server = createServer(async (req, res) => {
  // Parse request body for POST
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        req.body = JSON.parse(body);
      } catch (e) {
        req.body = {};
      }
      
      // Wrap res to make it compatible with Vercel handler
      res.status = (code) => { res.statusCode = code; return res; };
      res.json = (data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data, null, 2));
      };
      
      await handler(req, res);
    });
  } else if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.statusCode = 200;
    res.end();
  } else {
    res.statusCode = 404;
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 Test server running at http://localhost:${PORT}`);
  console.log(`\n📝 Test with:\n`);
  console.log(`curl -X POST http://localhost:${PORT}/api/update-metafield \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"customerId": "YOUR_CUSTOMER_ID", "phone": "+628123456789", "birthday": "1990-01-15"}'`);
  console.log(`\n🔑 Environment:`);
  console.log(`   SHOPIFY_STORE: ${process.env.SHOPIFY_STORE || 'NOT SET'}`);
  console.log(`   SHOPIFY_ACCESS_TOKEN: ${process.env.SHOPIFY_ACCESS_TOKEN ? '***' + process.env.SHOPIFY_ACCESS_TOKEN.slice(-4) : 'NOT SET'}`);
});
