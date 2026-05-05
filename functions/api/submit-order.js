const NOTION_VERSION = '2022-06-28';

export async function onRequestPost(context) {
  const NOTION_KEY = context.env.NOTION_KEY;
  const ORDERS_DB_ID = context.env.NOTION_ORDERS_DB_ID;

  if (!NOTION_KEY || !ORDERS_DB_ID) {
    return Response.json(
      { error: 'Missing NOTION_KEY or NOTION_ORDERS_DB_ID environment variable.' },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, email, shipping, shippingAddress, items } = body;

  if (!name || !email || !shipping || !items || items.length === 0) {
    return Response.json(
      { error: 'Missing required fields: name, email, shipping, and at least one item.' },
      { status: 400 }
    );
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
      return Response.json(
        { error: 'Notion API error', details: errText },
        { status: response.status }
      );
    }

    return Response.json({ success: true, orderId });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
