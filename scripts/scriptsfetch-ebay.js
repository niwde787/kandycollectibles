// scripts/fetch-ebay.js
import fs from 'fs';

const APP_ID = process.env.EBAY_APP_ID;
const CERT_ID = process.env.EBAY_CERT_ID;
const SELLER = 'kandycollectibles';

async function run() {
  const credentials = Buffer.from(`${APP_ID}:${CERT_ID}`).toString('base64');
  
  // 1. Get OAuth Token
  const tokenRes = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope'
  });
  
  const { access_token } = await tokenRes.json();

  // 2. Query Browse API
  const browseRes = await fetch(
    `https://api.ebay.com/buy/browse/v1/item_summary/search?filter=sellers:{${SELLER}}&limit=8&sort=newlyListed`,
    {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
      }
    }
  );

  const data = await browseRes.json();
  const items = (data.itemSummaries || []).map(item => ({
    title: item.title,
    price: `$${parseFloat(item.price?.value || 0).toFixed(2)}`,
    image: item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || '',
    url: item.itemWebUrl
  }));

  // 3. Save to a static file inside the repo
  if (!fs.existsSync('data')) fs.mkdirSync('data');
  fs.writeFileSync('data/ebay-items.json', JSON.stringify({ updated: new Date(), items }, null, 2));
  console.log(`Successfully synced ${items.length} items from @${SELLER}`);
}

run().catch(console.error);