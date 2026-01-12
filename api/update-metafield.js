/**
 * Shopify Customer Metafield Update API
 * Vercel Serverless Function
 * 
 * Updates customer metafields (phone_number, birthday) using Shopify Admin API
 * Supports multiple stores via token storage
 */

// Import token store from OAuth callback (shared in-memory storage)
// In production, replace with database lookup
const getToken = (shop) => {
  const tokenStore = globalThis.tokenStore || new Map();
  const storeData = tokenStore.get(shop);
  return storeData?.accessToken || process.env.SHOPIFY_ACCESS_TOKEN;
};

/**
 * Update customer metafields using GraphQL
 */
async function updateCustomerMetafields(shop, accessToken, customerId, phone, birthday) {
  // Build metafields array
  const metafields = [];

  if (phone) {
    metafields.push({
      ownerId: `gid://shopify/Customer/${customerId}`,
      namespace: 'custom',
      key: 'phone_number',
      type: 'single_line_text_field',
      value: phone,
    });
  }

  if (birthday) {
    metafields.push({
      ownerId: `gid://shopify/Customer/${customerId}`,
      namespace: 'custom',
      key: 'birthday',
      type: 'single_line_text_field',
      value: birthday,
    });
  }

  if (metafields.length === 0) {
    return { success: true, message: 'No metafields to update' };
  }

  const mutation = `
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          namespace
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      query: mutation,
      variables: { metafields },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('GraphQL request failed:', errorText);
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  const result = await response.json();

  if (result.errors) {
    console.error('GraphQL errors:', result.errors);
    throw new Error(result.errors[0].message);
  }

  const { metafieldsSet } = result.data;

  if (metafieldsSet.userErrors && metafieldsSet.userErrors.length > 0) {
    console.error('User errors:', metafieldsSet.userErrors);
    throw new Error(metafieldsSet.userErrors[0].message);
  }

  return {
    success: true,
    metafields: metafieldsSet.metafields,
  };
}

/**
 * CORS headers for cross-origin requests
 */
function getCorsHeaders(origin) {
  // Allow all origins for public app (stores will call from their domains)
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Main handler for Vercel serverless function
 */
export default async function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer || '';
  const corsHeaders = getCorsHeaders(origin);

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { shop, customerId, phone, birthday } = req.body;

    // Validate shop
    if (!shop) {
      return res.status(400).json({ success: false, error: 'Shop domain is required' });
    }

    if (!customerId) {
      return res.status(400).json({ success: false, error: 'Customer ID is required' });
    }

    // Get access token for this shop
    const accessToken = getToken(shop);
    if (!accessToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'App not installed on this shop. Please install first.' 
      });
    }

    // Validate phone format (basic validation)
    if (phone && typeof phone !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid phone format' });
    }

    // Validate birthday format (YYYY-MM-DD)
    if (birthday && !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
      return res.status(400).json({ success: false, error: 'Invalid birthday format. Use YYYY-MM-DD' });
    }

    const result = await updateCustomerMetafields(shop, accessToken, customerId, phone, birthday);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error updating metafields:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
