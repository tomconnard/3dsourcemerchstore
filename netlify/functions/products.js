// netlify/functions/products.js
// Fetches active products from your Notion database and returns them as JSON.
// Notion API key is read from NOTION_KEY env var (set in Netlify dashboard).
// Database ID is read from NOTION_DATABASE_ID env var.

const NOTION_VERSION = '2022-06-28';

exports.handler = async (event) => {
  const NOTION_KEY = process.env.NOTION_KEY;
  const DATABASE_ID = process.env.NOTION_DATABASE_ID;

  if (!NOTION_KEY || !DATABASE_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Missing NOTION_KEY or NOTION_DATABASE_ID environment variable.'
      })
    };
  }

  try {
    // Query Notion: only return rows where Active = true, sorted by Title
    const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_KEY}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: {
          property: 'Active',
          checkbox: { equals: true }
        },
        sorts: [
          { property: 'Type', direction: 'ascending' },
          { property: 'Title', direction: 'ascending' }
        ],
        page_size: 100
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Notion API error', details: errText })
      };
    }

    const data = await response.json();

    // Transform Notion's verbose format into clean product objects
    const products = data.results.map(row => {
      const props = row.properties;

      // Pull the first image URL from the Image files property
      let imageUrl = '';
      const imageFiles = props['Image']?.files || [];
      if (imageFiles.length > 0) {
        const first = imageFiles[0];
        // Notion files can be 'file' (uploaded) or 'external'
        imageUrl = first.file?.url || first.external?.url || '';
      }

      return {
        id: row.id,
        name: props['Title']?.title?.[0]?.plain_text || '',
        style: props['Style']?.rich_text?.[0]?.plain_text || '',
        type: props['Type']?.select?.name?.toLowerCase() || 'other',
        desc: props['Description']?.rich_text?.[0]?.plain_text || '',
        url: props['Printful URL']?.url || '',
        image: imageUrl
      };
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache for 5 min on CDN, 1 min in browser
        'Cache-Control': 'public, max-age=60, s-maxage=300'
      },
      body: JSON.stringify(products)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
