/**
 * Vercel Serverless Function: Get Stripe Checkout Session details
 * GET /api/get-session?session_id=cs_test_...
 *
 * Returns order details: customer info, shipping address, line items, amounts
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.query;

  if (!session_id || !session_id.startsWith('cs_')) {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  try {
    // Retrieve session with expanded line items
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'shipping_cost.shipping_rate'],
    });

    // Only return completed sessions
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Build safe response (no sensitive data)
    const response = {
      orderId: session.id.slice(-8).toUpperCase(),
      status: session.payment_status,
      customerEmail: session.customer_details?.email || null,
      customerName: session.customer_details?.name || null,
      shippingAddress: session.shipping_details?.address
        ? {
            name: session.shipping_details.name,
            line1: session.shipping_details.address.line1,
            line2: session.shipping_details.address.line2,
            city: session.shipping_details.address.city,
            state: session.shipping_details.address.state,
            postal_code: session.shipping_details.address.postal_code,
            country: session.shipping_details.address.country,
          }
        : null,
      items: (session.line_items?.data || []).map(item => ({
        name: item.description,
        quantity: item.quantity,
        amount: item.amount_total / 100,
        currency: item.currency.toUpperCase(),
      })),
      subtotal: session.amount_subtotal / 100,
      shipping: session.shipping_cost ? session.shipping_cost.amount_total / 100 : 0,
      total: session.amount_total / 100,
      currency: session.currency.toUpperCase(),
      createdAt: new Date(session.created * 1000).toISOString(),
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error('Get session error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve order details' });
  }
};
