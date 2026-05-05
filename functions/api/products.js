const NOTION_VERSION = '2022-06-28';

export async function onRequestGet(context) {
  const NOTION_KEY = context.env.NOTION_KEY;
  const DATABASE_ID = context.env.NOTION_DATABASE_ID;

  if (!NOTION_KEY || !DATABASE_ID) {
    return Response.json(
      { error: 'Missing NOTION_KEY or NOTION_DATABASE_ID environment variable.' },
      { status: 500 }
    );
  }

  try {
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
      return Response.json(
        { error: 'Notion API error', details: errText },
        { status: response.status }
      );
    }

    const data = await response.json();

    const products = data.results.map(row => {
      const props = row.properties;

      const imageFiles = props['Image']?.files || [];
      const images = imageFiles.map(f => f.file?.url || f.external?.url || '').filter(Boolean);

      return {
        id: row.id,
        name: props['Title']?.title?.[0]?.plain_text || '',
        type: props['Type']?.select?.name || '',
        logoType: props['Logo Type']?.select?.name || '',
        logoColor: props['Logo Color']?.select?.name || '',
        printType: props['Print Type']?.select?.name || '',
        brand: props['Brand']?.select?.name || '',
        desc: props['Description']?.rich_text?.[0]?.plain_text || '',
        fullDesc: props['Full Description']?.rich_text?.[0]?.plain_text || '',
        material: props['Material']?.select?.name || '',
        weight: props['Weight']?.select?.name || '',
        url: props['Printful URL']?.url || '',
        colors: props['Color']?.multi_select?.map(s => s.name) || [],
        sizes: props['Size']?.multi_select?.map(s => s.name) || [],
        images: images
      };
    });

    return Response.json(products, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300'
      }
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
