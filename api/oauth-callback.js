/**
 * OAuth Callback Handler
 * Exchanges authorization code for access token after app installation
 * Stores token in Vercel KV or memory for multi-store support
 */

// Simple in-memory token storage (replace with database in production)
// For Vercel, you can use Vercel KV, Upstash Redis, or another database
const tokenStore = globalThis.tokenStore || (globalThis.tokenStore = new Map());

export default async function handler(req, res) {
  const { code, shop, state } = req.query;
  
  // Validate required parameters
  if (!code || !shop) {
    return res.status(400).send('Missing required parameters: code or shop');
  }
  
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return res.status(500).send('Missing SHOPIFY_CLIENT_ID or SHOPIFY_CLIENT_SECRET');
  }
  
  try {
    // Exchange authorization code for access token
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('OAuth token exchange failed:', error);
      return res.status(400).send(`Token exchange failed: ${error}`);
    }
    
    const data = await response.json();
    const accessToken = data.access_token;
    const scope = data.scope;
    
    // Store the token (in production, use a proper database)
    tokenStore.set(shop, {
      accessToken,
      scope,
      installedAt: new Date().toISOString(),
    });
    
    console.log(`App installed on ${shop} with scopes: ${scope}`);
    
    // Display success page
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>App Installed</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
          .success { color: #008060; font-size: 48px; }
          .box { background: #f4f6f8; padding: 20px; border-radius: 8px; margin: 20px 0; }
          code { background: #e9ecef; padding: 4px 8px; border-radius: 4px; }
          .token { word-break: break-all; background: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 4px; margin: 10px 0; text-align: left; font-family: monospace; font-size: 12px; }
          button { padding: 10px 20px; background: #008060; color: white; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }
          button:hover { background: #006e52; }
        </style>
      </head>
      <body>
        <div class="success">✓</div>
        <h1>App Installed Successfully!</h1>
        <p>Your app has been installed on <strong>${shop}</strong></p>
        
        <div class="box">
          <h3>Access Token</h3>
          <p>⚠️ <strong>Copy this token now!</strong> It won't be shown again.</p>
          <div class="token" id="token">${accessToken}</div>
          <button onclick="navigator.clipboard.writeText('${accessToken}'); this.textContent='Copied!'">
            Copy Token
          </button>
        </div>
        
        <div class="box">
          <h3>API Usage</h3>
          <p>Use this endpoint to update customer metafields:</p>
          <code>POST /api/update-metafield</code>
          <pre style="text-align: left; overflow-x: auto;">
{
  "shop": "${shop}",
  "customerId": "123456789",
  "phone": "+628123456789",
  "birthday": "1990-01-15"
}
          </pre>
        </div>
        
        <p>Granted scopes: <code>${scope}</code></p>
        <p><a href="https://${shop}/admin">Return to Shopify Admin</a></p>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).send(`OAuth error: ${error.message}`);
  }
}

// Export token store for use by other endpoints
export { tokenStore };
