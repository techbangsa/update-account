/**
 * OAuth Install Initiator
 * Redirects to Shopify OAuth authorization page
 */

export default async function handler(req, res) {
  const { shop } = req.query;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const appUrl = process.env.APP_URL || `https://${req.headers.host}`;
  const redirectUri = `${appUrl}/api/oauth-callback`;
  const scopes = 'read_customers,write_customers';
  
  if (!shop) {
    res.setHeader('Content-Type', 'text/html');
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Install App</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; }
          input, button { padding: 12px; font-size: 16px; margin: 5px 0; }
          input { width: 100%; border: 1px solid #ccc; border-radius: 4px; }
          button { background: #008060; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%; }
          button:hover { background: #006e52; }
        </style>
      </head>
      <body>
        <h1>Install App</h1>
        <form action="/api/oauth-install" method="GET">
          <label>Enter your Shopify store URL:</label>
          <input type="text" name="shop" placeholder="your-store.myshopify.com" required>
          <button type="submit">Install App</button>
        </form>
      </body>
      </html>
    `);
  }
  
  if (!clientId) {
    return res.status(500).send('Missing SHOPIFY_CLIENT_ID environment variable');
  }
  
  // Validate shop format
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  if (!shopRegex.test(shop)) {
    return res.status(400).send('Invalid shop domain. Use format: your-store.myshopify.com');
  }
  
  // Generate nonce for CSRF protection
  const nonce = Math.random().toString(36).substring(2, 15);
  
  // Build the OAuth authorization URL
  const authUrl = `https://${shop}/admin/oauth/authorize?` + new URLSearchParams({
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    state: nonce,
  });
  
  res.redirect(authUrl);
}
