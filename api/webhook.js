/**
 * Vercel Serverless Function: Stripe Webhook Handler
 * POST /api/webhook
 *
 * Listens for checkout.session.completed events and sends:
 *   1. Order confirmation email to the customer
 *   2. New order notification email to the admin
 *
 * Environment variables required:
 *   STRIPE_SECRET_KEY    - Stripe secret key
 *   STRIPE_WEBHOOK_SECRET - Stripe webhook signing secret (whsec_...)
 *   RESEND_API_KEY       - Resend API key (re_...)
 *   ADMIN_EMAIL          - Admin email for order notifications
 *   SITE_URL             - Store URL
 *   GOOGLE_SHEETS_URL    - Google Apps Script Web App URL
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Disable body parsing — Stripe needs the raw body for signature verification
module.exports.config = {
  api: { bodyParser: false },
};

/**
 * Read raw body from request stream
 */
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      // Retrieve full session with line items
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items', 'shipping_cost.shipping_rate'],
      });

      const order = buildOrderData(fullSession);

      // Send emails and record to Google Sheets in parallel
      await Promise.all([
        sendCustomerEmail(order),
        sendAdminEmail(order),
        recordToGoogleSheets(order),
      ]);

      console.log(`Order #HH-${order.orderId}: emails sent, recorded to Sheets`);
    } catch (err) {
      console.error('Email sending failed:', err.message);
      // Don't return error — Stripe will retry the webhook
    }
  }

  return res.status(200).json({ received: true });
};

/**
 * Build order data from Stripe session
 */
function buildOrderData(session) {
  return {
    orderId: session.id.slice(-8).toUpperCase(),
    sessionId: session.id,
    customerEmail: session.customer_details?.email,
    customerName: session.customer_details?.name,
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
    })),
    subtotal: session.amount_subtotal / 100,
    shipping: session.shipping_cost ? session.shipping_cost.amount_total / 100 : 0,
    total: session.amount_total / 100,
    currency: session.currency.toUpperCase(),
    createdAt: new Date(session.created * 1000),
  };
}

/**
 * Send order confirmation email to the customer
 */
async function sendCustomerEmail(order) {
  if (!order.customerEmail) return;

  const siteUrl = process.env.SITE_URL || 'https://hemhemsaigon-store.vercel.app';
  const dateStr = order.createdAt.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const itemsHTML = order.items.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #222;color:#fff;font-size:14px;">
        ${item.name}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #222;color:#999;font-size:14px;text-align:center;">
        x${item.quantity}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #222;color:#E6FF00;font-size:14px;text-align:right;font-weight:600;">
        $${item.amount.toFixed(2)}
      </td>
    </tr>
  `).join('');

  const addressHTML = order.shippingAddress
    ? `
      <div style="margin-top:24px;padding:20px;background:#111;border:1px solid #222;">
        <div style="font-size:10px;letter-spacing:2px;color:#666;text-transform:uppercase;margin-bottom:12px;">Shipping To</div>
        <p style="margin:0;color:#fff;font-weight:600;">${order.shippingAddress.name}</p>
        <p style="margin:4px 0 0;color:#999;font-size:14px;">${order.shippingAddress.line1}</p>
        ${order.shippingAddress.line2 ? `<p style="margin:2px 0 0;color:#999;font-size:14px;">${order.shippingAddress.line2}</p>` : ''}
        <p style="margin:2px 0 0;color:#999;font-size:14px;">${order.shippingAddress.city}${order.shippingAddress.state ? ', ' + order.shippingAddress.state : ''} ${order.shippingAddress.postal_code || ''}</p>
        <p style="margin:2px 0 0;color:#999;font-size:14px;">${order.shippingAddress.country}</p>
      </div>`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#000;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:40px;">
      <div style="font-size:24px;font-weight:700;color:#fff;letter-spacing:-0.5px;">Hem★Hem SaiGon</div>
      <div style="font-size:11px;color:#666;letter-spacing:3px;text-transform:uppercase;margin-top:4px;">Official Merch Store</div>
    </div>

    <!-- Success Icon -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;width:56px;height:56px;border-radius:50%;border:2px solid #22c55e;line-height:56px;font-size:28px;">✓</div>
    </div>

    <h1 style="text-align:center;color:#fff;font-size:28px;font-weight:700;margin:0 0 8px;">Order Confirmed!</h1>
    <p style="text-align:center;color:#999;font-size:15px;margin:0 0 32px;">
      Thank you for your purchase, ${order.customerName || 'valued customer'}!
    </p>

    <!-- Order Card -->
    <div style="background:#0a0a0a;border:1px solid #222;margin-bottom:32px;">

      <!-- Order Header -->
      <div style="display:flex;justify-content:space-between;padding:20px;border-bottom:1px solid #222;background:#111;">
        <div>
          <div style="font-size:10px;letter-spacing:2px;color:#666;text-transform:uppercase;">Order ID</div>
          <div style="font-size:16px;font-weight:700;color:#fff;margin-top:4px;">#HH-${order.orderId}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:10px;letter-spacing:2px;color:#666;text-transform:uppercase;">Date</div>
          <div style="font-size:14px;color:#fff;margin-top:4px;">${dateStr}</div>
        </div>
      </div>

      <!-- Items -->
      <div style="padding:20px;">
        <div style="font-size:10px;letter-spacing:2px;color:#666;text-transform:uppercase;margin-bottom:16px;">Items Ordered</div>
        <table style="width:100%;border-collapse:collapse;">
          ${itemsHTML}
        </table>
      </div>

      <!-- Totals -->
      <div style="padding:16px 20px;border-top:1px solid #222;">
        <table style="width:100%;">
          <tr>
            <td style="color:#999;font-size:14px;padding:4px 0;">Subtotal</td>
            <td style="color:#fff;font-size:14px;text-align:right;padding:4px 0;">$${order.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="color:#999;font-size:14px;padding:4px 0;">Shipping</td>
            <td style="color:#fff;font-size:14px;text-align:right;padding:4px 0;">$${order.shipping.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="color:#E6FF00;font-size:18px;font-weight:700;padding:12px 0 4px;border-top:1px solid #333;">Total</td>
            <td style="color:#E6FF00;font-size:18px;font-weight:700;text-align:right;padding:12px 0 4px;border-top:1px solid #333;">$${order.total.toFixed(2)} ${order.currency}</td>
          </tr>
        </table>
      </div>

      <!-- Shipping Address -->
      ${addressHTML}
    </div>

    <!-- Delivery Estimate -->
    <div style="padding:20px;background:#111;border:1px solid #222;margin-bottom:32px;">
      <div style="font-size:10px;letter-spacing:2px;color:#666;text-transform:uppercase;margin-bottom:12px;">Estimated Delivery</div>
      <p style="margin:0;color:#fff;font-size:14px;">
        ${order.shippingAddress?.country === 'VN'
          ? '🇻🇳 Vietnam Domestic: 3–5 business days'
          : ((['JP','KR','TW','SG','MY','TH'].includes(order.shippingAddress?.country))
            ? '🌏 Asia: 7–14 business days'
            : '🌍 International: 14–21 business days')}
      </p>
    </div>

    <!-- Event CTA -->
    <div style="text-align:center;padding:32px 24px;background:linear-gradient(135deg,#111 0%,#1a1a0a 100%);border:1px solid #333;margin-bottom:32px;">
      <div style="font-size:20px;font-weight:700;color:#E6FF00;margin-bottom:8px;">🎺 See You at the Show!</div>
      <p style="color:#ccc;font-size:14px;line-height:1.6;margin:0 0 20px;">
        We can't wait to see you wearing this at our next gig!<br>
        Check out our upcoming live schedule.
      </p>
      <a href="${siteUrl}#/events" style="display:inline-block;padding:12px 32px;background:#E6FF00;color:#000;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:1px;">
        VIEW EVENTS →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding-top:24px;border-top:1px solid #222;">
      <p style="color:#666;font-size:12px;margin:0;">
        Hem★Hem SaiGon — Ska orchestra born in the alleys of Ho Chi Minh City.
      </p>
      <p style="color:#666;font-size:12px;margin:8px 0 0;">
        No Rice No Life since 2012.
      </p>
      <div style="margin-top:16px;">
        <a href="https://www.facebook.com/hemhemsaigon/" style="color:#999;text-decoration:none;font-size:12px;margin:0 8px;">Facebook</a>
        <a href="https://www.instagram.com/hemsaigon_/" style="color:#999;text-decoration:none;font-size:12px;margin:0 8px;">Instagram</a>
        <a href="${siteUrl}" style="color:#999;text-decoration:none;font-size:12px;margin:0 8px;">Store</a>
      </div>
      <p style="color:#444;font-size:11px;margin:16px 0 0;">
        Questions? Reply to this email or contact <a href="mailto:hemhemsaigon@gmail.com" style="color:#E6FF00;">hemhemsaigon@gmail.com</a>
      </p>
    </div>

  </div>
</body>
</html>`;

  await resend.emails.send({
    from: 'Hem★Hem SaiGon Store <onboarding@resend.dev>',
    to: order.customerEmail,
    subject: `Order Confirmed! #HH-${order.orderId} — Hem★Hem SaiGon`,
    html,
  });
}

/**
 * Send new order notification to admin
 */
async function sendAdminEmail(order) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const dateStr = order.createdAt.toLocaleString('en-US');

  const itemsList = order.items.map(item =>
    `• ${item.name} x${item.quantity} — $${item.amount.toFixed(2)}`
  ).join('\n');

  const addressText = order.shippingAddress
    ? `${order.shippingAddress.name}\n${order.shippingAddress.line1}${order.shippingAddress.line2 ? '\n' + order.shippingAddress.line2 : ''}\n${order.shippingAddress.city}${order.shippingAddress.state ? ', ' + order.shippingAddress.state : ''} ${order.shippingAddress.postal_code || ''}\n${order.shippingAddress.country}`
    : 'N/A';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#000;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:20px;font-weight:700;color:#E6FF00;">🎉 New Order Received!</div>
    </div>

    <div style="background:#0a0a0a;border:1px solid #222;padding:24px;margin-bottom:24px;">
      <table style="width:100%;">
        <tr>
          <td style="color:#666;font-size:12px;padding:8px 0;">Order ID</td>
          <td style="color:#fff;font-size:14px;font-weight:700;text-align:right;">#HH-${order.orderId}</td>
        </tr>
        <tr>
          <td style="color:#666;font-size:12px;padding:8px 0;">Date</td>
          <td style="color:#fff;font-size:14px;text-align:right;">${dateStr}</td>
        </tr>
        <tr>
          <td style="color:#666;font-size:12px;padding:8px 0;">Customer</td>
          <td style="color:#fff;font-size:14px;text-align:right;">${order.customerName || '—'}</td>
        </tr>
        <tr>
          <td style="color:#666;font-size:12px;padding:8px 0;">Email</td>
          <td style="color:#fff;font-size:14px;text-align:right;">${order.customerEmail || '—'}</td>
        </tr>
        <tr>
          <td style="color:#666;font-size:12px;padding:8px 0;">Total</td>
          <td style="color:#E6FF00;font-size:18px;font-weight:700;text-align:right;">$${order.total.toFixed(2)} ${order.currency}</td>
        </tr>
      </table>
    </div>

    <div style="background:#0a0a0a;border:1px solid #222;padding:24px;margin-bottom:24px;">
      <div style="font-size:10px;letter-spacing:2px;color:#666;text-transform:uppercase;margin-bottom:16px;">Items</div>
      <pre style="color:#fff;font-size:13px;font-family:monospace;white-space:pre-wrap;margin:0;">${itemsList}</pre>
    </div>

    <div style="background:#0a0a0a;border:1px solid #222;padding:24px;">
      <div style="font-size:10px;letter-spacing:2px;color:#666;text-transform:uppercase;margin-bottom:12px;">Ship To</div>
      <pre style="color:#fff;font-size:13px;font-family:monospace;white-space:pre-wrap;margin:0;">${addressText}</pre>
    </div>

    <p style="text-align:center;color:#666;font-size:12px;margin-top:24px;">
      <a href="https://dashboard.stripe.com/payments" style="color:#E6FF00;">View in Stripe Dashboard →</a>
    </p>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: 'Hem★Hem Store Orders <onboarding@resend.dev>',
    to: adminEmail,
    subject: `🎉 New Order #HH-${order.orderId} — $${order.total.toFixed(2)} from ${order.customerName || 'Customer'}`,
    html,
  });
}

/**
 * Record order to Google Sheets via Apps Script Web App
 */
async function recordToGoogleSheets(order) {
  const sheetsUrl = process.env.GOOGLE_SHEETS_URL;
  if (!sheetsUrl) return;

  const dateStr = order.createdAt.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const itemsText = order.items.map(item =>
    `${item.name} x${item.quantity}`
  ).join(', ');

  const addressText = order.shippingAddress
    ? `${order.shippingAddress.name}, ${order.shippingAddress.line1}${order.shippingAddress.line2 ? ' ' + order.shippingAddress.line2 : ''}, ${order.shippingAddress.city} ${order.shippingAddress.postal_code || ''}, ${order.shippingAddress.country}`
    : 'N/A';

  const payload = JSON.stringify({
    orderId: `#HH-${order.orderId}`,
    date: dateStr,
    customer: order.customerName || '—',
    email: order.customerEmail || '—',
    items: itemsText,
    subtotal: `$${order.subtotal.toFixed(2)}`,
    shipping: `$${order.shipping.toFixed(2)}`,
    total: `$${order.total.toFixed(2)} ${order.currency}`,
    shippingAddress: addressText,
  });

  // Use https module to handle Google Apps Script's 302 redirect properly
  const https = require('https');
  const url = new URL(sheetsUrl);

  return new Promise((resolve) => {
    const postReq = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (response) => {
      // Follow redirect if Google returns 302
      if (response.statusCode === 302 && response.headers.location) {
        https.get(response.headers.location, () => resolve());
      } else {
        resolve();
      }
    });

    postReq.on('error', (err) => {
      console.error('Google Sheets recording failed:', err.message);
      resolve(); // Don't throw — emails are more important
    });

    postReq.write(payload);
    postReq.end();
  });
}
