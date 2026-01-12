# Customer Metafield Update - Public Shopify App

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/oauth-install` | Install page - redirects to Shopify OAuth |
| `GET /api/oauth-callback` | OAuth callback - exchanges code for token |
| `POST /api/update-metafield` | Update customer metafields |

## Installation

1. Visit: `https://update-account-indol.vercel.app/api/oauth-install`
2. Enter your store URL (e.g., `your-store.myshopify.com`)
3. Authorize the app
4. Copy the access token displayed

## API Usage

```bash
curl -X POST https://update-account-indol.vercel.app/api/update-metafield \
  -H "Content-Type: application/json" \
  -d '{
    "shop": "your-store.myshopify.com",
    "customerId": "123456789",
    "phone": "+628123456789",
    "birthday": "1990-01-15"
  }'
```

## Environment Variables (Vercel)

- `SHOPIFY_CLIENT_ID` - From Partners Dashboard
- `SHOPIFY_CLIENT_SECRET` - From Partners Dashboard
- `APP_URL` - Your Vercel URL
