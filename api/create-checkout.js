/**
 * Vercel Serverless Function: Create Stripe Checkout Session
 * POST /api/create-checkout
 *
 * Environment variables required:
 *   STRIPE_SECRET_KEY - Stripe secret key (sk_test_... or sk_live_...)
 *   SITE_URL - Your site URL (e.g., https://hemhem-store.vercel.app)
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items, currency = 'usd' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid items' });
    }

    // Build line items for Stripe
    const line_items = items.map(item => ({
      price_data: {
        currency,
        product_data: {
          name: item.name,
          description: item.size ? `Size: ${item.size}` : undefined,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.qty,
    }));

    // Add shipping
    const shipping_options = [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 500, currency },
          display_name: 'Standard Shipping',
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 7 },
            maximum: { unit: 'business_day', value: 14 },
          },
        },
      },
    ];

    const siteUrl = process.env.SITE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      shipping_options,
      shipping_address_collection: {
        allowed_countries: [
          'US', 'CA', 'GB', 'JP', 'VN', 'TH', 'SG', 'MY',
          'KR', 'TW', 'AU', 'DE', 'FR', 'NL', 'SE',
        ],
      },
      success_url: `${siteUrl}#/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}#/checkout`,
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
