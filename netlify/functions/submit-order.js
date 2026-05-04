const NOTION_VERSION = '2022-06-28';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const NOTION_KEY = process.env.NOTION_KEY;
  const ORDERS_DB_ID = process.env.NOTION_ORDERS_DB_ID;

  if (!NOTION_KEY || !ORDERS_DB_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing NOTION_KEY or NOTION_ORDERS_DB_ID environment variable.' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { name, email, shipping, shippingAddress, items } = body;

  if (!name || !email || !shipping || !items || items.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields: name, email, shipping, and at least one item.' })
    };
  }

  const orderId = `ORD-${Date.now()}`;

  const itemsText = items.map((item, i) =>
    `${i + 1}. ${item.name} — Size: ${item.size} — Color: ${item.color} — Qty: ${item.qty || 1}`
  ).join('\n');

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_KEY}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: ORDERS_DB_ID },
        properties: {
          'Order ID': {
            title: [{ text: { content: orderId } }]
          },
          'Name': {
            rich_text: [{ text: { content: name } }]
          },
          'Email': {
            email: email
          },
          'Shipping': {
            select: { name: shipping }
          },
          'Shipping Address': {
            rich_text: [{ text: { content: shippingAddress || '' } }]
          },
          'Items': {
            rich_text: [{ text: { content: itemsText } }]
          },
          'Status': {
            select: { name: 'Pending' }
          },
          'Submitted': {
            date: { start: new Date().toISOString() }
          }
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Notion API error', details: errText })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, orderId })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
