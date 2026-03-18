/**
 * Hem★Hem SaiGon EC Store — Main Application
 * SPA with hash routing, cart, product rendering
 */

// ═══════════════════════════════════════════════════════════════
// PRODUCT DATA
// ═══════════════════════════════════════════════════════════════

const PRODUCTS = [
  {
    id: 1,
    name: "Hem★Hem Logo Tee — Blue",
    category: "T-Shirts",
    price: 35,
    description: "Classic crew neck tee featuring the iconic Hem★Hem SaiGon circular logo in blue. 100% premium cotton, pre-shrunk. Printed in Ho Chi Minh City with water-based inks.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    tag: "new",
    emoji: "👕"
  },
  {
    id: 2,
    name: "Hem★Hem Logo Tee — Black",
    category: "T-Shirts",
    price: 35,
    description: "The iconic Hem★Hem SaiGon logo on deep black. Heavyweight 220gsm cotton for durability. A must-have for any fan.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    tag: null,
    emoji: "👕"
  },
  {
    id: 3,
    name: "Rice Skull Character Tee",
    category: "T-Shirts",
    price: 32,
    description: "Featuring the beloved rice skull mascot in his classic dancing pose. Screen-printed on soft ringspun cotton. Have a Rice Day!",
    sizes: ["S", "M", "L", "XL"],
    tag: null,
    emoji: "👕"
  },
  {
    id: 4,
    name: "Skull Character Hoodie",
    category: "Outerwear",
    price: 55,
    description: "Heavyweight hoodie with the Hem★Hem rice skull character on the back. Fleece-lined, kangaroo pocket. Perfect for outdoor shows.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    tag: "limited",
    emoji: "🎽"
  },
  {
    id: 5,
    name: "Checkered Windbreaker",
    category: "Outerwear",
    price: 65,
    description: "Lightweight windbreaker featuring Hem★Hem's signature checkered pattern. Water-resistant, packable. From alley shows to festivals.",
    sizes: ["S", "M", "L", "XL"],
    tag: "new",
    emoji: "🧥"
  },
  {
    id: 6,
    name: "Rice Day Snapback",
    category: "Headwear",
    price: 28,
    description: "Structured snapback with 'HAVE A RICE DAY' embroidered on the front. Adjustable snap closure. One size fits most.",
    sizes: null,
    tag: "limited",
    emoji: "🧢"
  },
  {
    id: 7,
    name: "Checkered Bucket Hat",
    category: "Headwear",
    price: 25,
    description: "Reversible bucket hat — checkered on one side, solid black on the other. Cotton twill, packable.",
    sizes: null,
    tag: null,
    emoji: "🧢"
  },
  {
    id: 8,
    name: "No Rice No Life Sticker Pack",
    category: "Accessories",
    price: 8,
    description: "Pack of 10 die-cut vinyl stickers featuring Hem★Hem characters and slogans. Waterproof, UV-resistant. Stick them everywhere.",
    sizes: null,
    tag: null,
    emoji: "🎵"
  },
  {
    id: 9,
    name: "Checkered Pick Set",
    category: "Accessories",
    price: 12,
    description: "Set of 6 custom guitar picks in Hem★Hem checkered design. Medium gauge, celluloid. Play like a ska star.",
    sizes: null,
    tag: null,
    emoji: "🎸"
  },
  {
    id: 10,
    name: "Hem★Hem Tote Bag",
    category: "Bags",
    price: 22,
    description: "Canvas tote bag with the Hem★Hem SaiGon logo. Reinforced handles, inner pocket. Carry your rice in style.",
    sizes: null,
    tag: null,
    emoji: "👜"
  },
  {
    id: 11,
    name: "Rice Day EP — Vinyl",
    category: "Music",
    price: 18,
    description: "Limited pressing of the Rice Day EP on 180g vinyl. 4 tracks of pure Saigon ska energy. Includes lyric insert.",
    sizes: null,
    tag: "collab",
    emoji: "📀"
  },
  {
    id: 12,
    name: "Hem★Hem × Pasteur St. Glass Set",
    category: "Drinkware",
    price: 30,
    description: "Collaboration with Pasteur Street Brewing. Set of 2 pint glasses with Hem★Hem branding. Cheers to rice beer!",
    sizes: null,
    tag: "collab",
    emoji: "🍺"
  },
  {
    id: 13,
    name: "Hem★Hem Enamel Pin Set",
    category: "Accessories",
    price: 15,
    description: "Set of 3 enamel pins: Rice Skull, Logo Badge, and 'No Rice No Life' banner. Hard enamel with butterfly clutch backs.",
    sizes: null,
    tag: "new",
    emoji: "📌"
  }
];

const CATEGORIES = ["All", ...new Set(PRODUCTS.map(p => p.category))];

// ═══════════════════════════════════════════════════════════════
// CART
// ═══════════════════════════════════════════════════════════════

let cart = [];

function addToCart(productId, size = null, qty = 1) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.productId === productId && item.size === size);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ productId, name: product.name, price: product.price, size, qty, emoji: product.emoji });
  }
  renderCart();
  showNotification(`${product.name} added to cart`);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  renderCart();
}

function updateQty(index, delta) {
  if (!cart[index]) return;
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  renderCart();
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function renderCart() {
  const count = getCartCount();
  const total = getCartTotal();

  // Badge
  const badge = document.getElementById('cartCount');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }

  // Item count in drawer header
  const drawerCount = document.getElementById('cartItemCount');
  if (drawerCount) drawerCount.textContent = count;

  // Cart items
  const container = document.getElementById('cartItems');
  const empty = document.getElementById('cartEmpty');
  const footer = document.getElementById('cartFooter');

  if (container) {
    if (cart.length === 0) {
      if (empty) empty.style.display = 'block';
      if (footer) footer.style.display = 'none';
      // Remove item elements but keep empty message
      container.querySelectorAll('.cart-item').forEach(el => el.remove());
    } else {
      if (empty) empty.style.display = 'none';
      if (footer) footer.style.display = 'block';

      // Rebuild items
      const existingItems = container.querySelectorAll('.cart-item');
      existingItems.forEach(el => el.remove());

      cart.forEach((item, i) => {
        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = `
          <div class="cart-item-image">${item.emoji}</div>
          <div class="cart-item-details">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-variant">${item.size ? 'Size: ' + item.size : 'One Size'}</div>
            <div class="cart-item-bottom">
              <div class="qty-control">
                <button class="qty-btn" data-action="dec" data-index="${i}">−</button>
                <span class="qty-value">${item.qty}</span>
                <button class="qty-btn" data-action="inc" data-index="${i}">+</button>
              </div>
              <span class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</span>
            </div>
          </div>
        `;
        if (empty) container.insertBefore(el, empty);
        else container.appendChild(el);
      });

      // Attach qty listeners
      container.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.index);
          const delta = btn.dataset.action === 'inc' ? 1 : -1;
          updateQty(idx, delta);
        });
      });
    }
  }

  // Totals
  const totalVal = document.getElementById('cartTotalValue');
  const totalCrypto = document.getElementById('cartTotalCrypto');
  if (totalVal) totalVal.textContent = `$${total.toFixed(2)}`;
  if (totalCrypto) totalCrypto.textContent = `≈ ${total.toFixed(2)} USDC`;

  // Update checkout summary if on that page
  renderCheckoutSummary();
}

// ═══════════════════════════════════════════════════════════════
// PRODUCT RENDERING
// ═══════════════════════════════════════════════════════════════

function productCardHTML(product) {
  const tagHTML = product.tag
    ? `<span class="product-tag tag-${product.tag}">${product.tag === 'collab' ? 'Collab' : product.tag === 'limited' ? 'Limited' : 'New'}</span>`
    : '';

  return `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-image">
        <div class="product-image-placeholder">${product.emoji}</div>
        ${tagHTML}
        <div class="product-overlay">
          <button class="btn-add" data-quick-add="${product.id}">Quick Add</button>
        </div>
      </div>
      <div class="product-info">
        <div class="product-name">${product.name}</div>
        <div class="product-category">${product.category}</div>
        <div class="product-price">$${product.price.toFixed(2)} <span class="crypto">≈ ${product.price.toFixed(0)} USDC</span></div>
      </div>
    </div>
  `;
}

function renderProductGrid(products, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = products.map(p => productCardHTML(p)).join('');
  attachProductListeners(container);
}

function attachProductListeners(container) {
  // Card click → detail
  container.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-add')) return; // don't navigate on quick-add
      const id = parseInt(card.dataset.productId);
      window.location.hash = `#/product/${id}`;
    });
  });

  // Quick add
  container.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.quickAdd);
      const product = PRODUCTS.find(p => p.id === id);
      if (product && product.sizes) {
        // If has sizes, go to detail
        window.location.hash = `#/product/${id}`;
      } else {
        addToCart(id);
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// PRODUCT DETAIL
// ═══════════════════════════════════════════════════════════════

function renderProductDetail(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  const container = document.getElementById('detail-container');
  if (!container || !product) return;

  const sizesHTML = product.sizes
    ? `<div class="detail-options">
        <div class="option-label">Size</div>
        <div class="size-options">
          ${product.sizes.map((s, i) => `<button class="size-btn${i === 1 ? ' selected' : ''}" data-size="${s}">${s}</button>`).join('')}
        </div>
      </div>`
    : '';

  container.innerHTML = `
    <div class="detail-gallery">
      <div class="detail-main-image">${product.emoji}</div>
      <div class="detail-thumbnails">
        <div class="detail-thumb active"></div>
        <div class="detail-thumb"></div>
        <div class="detail-thumb"></div>
      </div>
    </div>
    <div class="detail-info">
      <div class="detail-breadcrumb">
        <a href="#/shop">Shop</a> / ${product.category}
      </div>
      <h1 class="detail-name">${product.name}</h1>
      <div class="detail-price">
        $${product.price.toFixed(2)}
        <span class="crypto-price">≈ ${product.price.toFixed(0)} USDC · Multi-chain supported</span>
      </div>
      <p class="detail-desc">${product.description}</p>
      ${sizesHTML}
      <div class="detail-actions">
        <button class="btn-cart" id="addToCartBtn" data-product-id="${product.id}">Add to Cart</button>
        <button class="btn-wishlist">♡</button>
      </div>
      <div class="payment-methods">
        <div class="option-label">Accepted Payments</div>
        <div class="payment-icons">
          <div class="payment-icon"><span class="chain-dot chain-evm"></span> EVM</div>
          <div class="payment-icon"><span class="chain-dot chain-sol"></span> Solana</div>
          <div class="payment-icon"><span class="chain-dot chain-stripe"></span> Stripe</div>
          <div class="payment-icon"><span class="chain-dot chain-paypal"></span> PayPal</div>
        </div>
      </div>
    </div>
  `;

  // Size selection
  container.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // Add to cart
  const addBtn = document.getElementById('addToCartBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const selectedSize = container.querySelector('.size-btn.selected');
      const size = selectedSize ? selectedSize.dataset.size : null;

      if (product.sizes && !size) {
        showNotification('Please select a size', 'error');
        return;
      }
      addToCart(product.id, size);
      toggleCart();
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// SHOP FILTERS
// ═══════════════════════════════════════════════════════════════

let activeFilter = 'All';

function renderShopFilters() {
  const container = document.getElementById('shopFilters');
  if (!container) return;

  container.innerHTML = CATEGORIES.map(cat =>
    `<button class="filter-btn${cat === activeFilter ? ' active' : ''}" data-category="${cat}">${cat}</button>`
  ).join('');

  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.category;
      container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderShopProducts();
    });
  });
}

function renderShopProducts() {
  const filtered = activeFilter === 'All'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === activeFilter);

  const countEl = document.getElementById('shopCount');
  if (countEl) countEl.textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;

  renderProductGrid(filtered, 'shop-product-grid');
}

// ═══════════════════════════════════════════════════════════════
// CHECKOUT
// ═══════════════════════════════════════════════════════════════

function renderCheckoutSummary() {
  const container = document.getElementById('checkout-summary');
  if (!container) return;

  const total = getCartTotal();
  const shipping = cart.length > 0 ? 5 : 0;
  const grandTotal = total + shipping;

  if (cart.length === 0) {
    container.innerHTML = `<div style="padding:32px;border:1px solid var(--border);text-align:center;color:var(--text-muted);">
      Your cart is empty. <a href="#/shop" style="color:var(--accent);">Browse products</a>
    </div>`;
    return;
  }

  container.innerHTML = `
    <div style="padding:24px;border:1px solid var(--border);margin-top:20px;">
      ${cart.map(item => `
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:var(--text-muted);font-size:14px;">${item.name}${item.size ? ' (' + item.size + ')' : ''} × ${item.qty}</span>
          <span style="font-weight:600;">$${(item.price * item.qty).toFixed(2)}</span>
        </div>
      `).join('')}
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;padding-top:12px;border-top:1px solid var(--border);">
        <span style="color:var(--text-muted);font-size:14px;">Shipping</span>
        <span style="font-weight:600;">$${shipping.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding-top:16px;border-top:1px solid var(--border);">
        <span style="font-weight:700;font-size:18px;">Total</span>
        <div style="text-align:right;">
          <span style="font-weight:700;font-size:18px;color:var(--accent);">$${grandTotal.toFixed(2)}</span>
          <span style="display:block;font-size:12px;color:var(--text-muted);">≈ ${grandTotal.toFixed(2)} USDC</span>
        </div>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// PAYMENT SELECTION (CHECKOUT)
// ═══════════════════════════════════════════════════════════════

window.app = {
  selectPayment(el) {
    document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');

    const method = el.dataset.method;
    const walletArea = document.getElementById('walletConnectArea');
    if (walletArea) {
      if (method === 'evm' || method === 'solana') {
        walletArea.style.display = 'block';
        walletArea.querySelector('p').textContent =
          method === 'evm'
            ? 'Connect your EVM wallet (MetaMask, WalletConnect, etc.)'
            : 'Connect your Solana wallet (Phantom, Solflare, etc.)';
      } else {
        walletArea.style.display = 'none';
      }
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// CART DRAWER TOGGLE
// ═══════════════════════════════════════════════════════════════

function toggleCart() {
  const overlay = document.getElementById('cartOverlay');
  const drawer = document.getElementById('cartDrawer');
  if (overlay && drawer) {
    overlay.classList.toggle('open');
    drawer.classList.toggle('open');
  }
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION
// ═══════════════════════════════════════════════════════════════

function showNotification(message, type = 'success') {
  const el = document.getElementById('notification');
  if (!el) return;

  el.textContent = message;
  el.className = 'notification show';
  if (type === 'error') el.style.background = '#ff4444';
  else el.style.background = 'var(--accent)';

  setTimeout(() => { el.className = 'notification'; }, 2500);
}

// ═══════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════

function handleRoute() {
  const hash = window.location.hash || '#/';
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.classList.remove('active'));

  // Nav active state
  document.querySelectorAll('.nav-link[data-page]').forEach(l => l.classList.remove('active'));

  if (hash.startsWith('#/product/')) {
    const id = parseInt(hash.split('/')[2]);
    document.getElementById('page-detail').classList.add('active');
    renderProductDetail(id);
  } else if (hash === '#/shop') {
    document.getElementById('page-shop').classList.add('active');
    document.querySelector('.nav-link[data-page="shop"]')?.classList.add('active');
    renderShopFilters();
    renderShopProducts();
  } else if (hash === '#/checkout') {
    document.getElementById('page-checkout').classList.add('active');
    renderCheckoutSummary();
  } else {
    // Home
    document.getElementById('page-home').classList.add('active');
    document.querySelector('.nav-link[data-page="home"]')?.classList.add('active');
  }

  window.scrollTo(0, 0);
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  // Featured: products with tags
  const featured = PRODUCTS.filter(p => p.tag).slice(0, 4);
  renderProductGrid(featured, 'featured-grid');

  // Best sellers: remaining products
  const bestSellers = PRODUCTS.filter(p => !p.tag || p.tag === 'collab').slice(0, 4);
  renderProductGrid(bestSellers, 'bestseller-grid');

  // Cart toggle
  document.getElementById('cartToggle')?.addEventListener('click', toggleCart);
  document.getElementById('cartOverlay')?.addEventListener('click', toggleCart);
  document.getElementById('cartClose')?.addEventListener('click', toggleCart);

  // Cart checkout button
  document.getElementById('cartCheckoutBtn')?.addEventListener('click', () => {
    toggleCart();
    window.location.hash = '#/checkout';
  });

  // Mobile menu
  document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    document.getElementById('navLinks')?.classList.toggle('mobile-open');
  });

  // Wallet connect
  document.getElementById('connectWalletBtn')?.addEventListener('click', () => {
    connectWallet();
  });

  // Confirm pay
  document.getElementById('confirmPayBtn')?.addEventListener('click', () => {
    if (cart.length === 0) {
      showNotification('Your cart is empty', 'error');
      return;
    }
    processPayment();
  });

  // Initial render
  renderCart();
  handleRoute();

  // Hash change listener
  window.addEventListener('hashchange', handleRoute);
});

// ═══════════════════════════════════════════════════════════════
// PAYMENT PROCESSING
// ═══════════════════════════════════════════════════════════════

/**
 * Get currently selected payment method
 */
function getSelectedPaymentMethod() {
  const selected = document.querySelector('.payment-option.selected');
  return selected ? selected.dataset.method : 'evm';
}

/**
 * Process payment based on selected method
 */
async function processPayment() {
  const method = getSelectedPaymentMethod();

  if (method === 'stripe' || method === 'paypal') {
    await processStripeCheckout();
  } else if (method === 'evm') {
    await processEvmPayment();
  } else if (method === 'solana') {
    await processSolanaPayment();
  }
}

/**
 * Stripe Checkout — redirect to hosted checkout page
 */
async function processStripeCheckout() {
  const btn = document.getElementById('confirmPayBtn');
  const origText = btn.textContent;
  btn.textContent = 'Redirecting...';
  btn.disabled = true;

  try {
    const items = cart.map(item => ({
      name: item.name,
      price: item.price,
      size: item.size,
      qty: item.qty,
    }));

    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });

    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error(data.error || 'Failed to create checkout session');
    }
  } catch (err) {
    console.error('Stripe checkout error:', err);
    showNotification('Payment failed: ' + err.message, 'error');
    btn.textContent = origText;
    btn.disabled = false;
  }
}

// ═══════════════════════════════════════════════════════════════
// EVM WALLET (MetaMask / WalletConnect)
// ═══════════════════════════════════════════════════════════════

// USDC contract addresses per chain
const USDC_CONTRACTS = {
  1:     '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Ethereum
  43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // Avalanche
  8453:  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
  137:   '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // Polygon
};

// Your receiving wallet — UPDATE THIS
const MERCHANT_EVM_ADDRESS = '0xYOUR_EVM_WALLET_ADDRESS_HERE';
const MERCHANT_SOL_ADDRESS = 'YOUR_SOLANA_WALLET_ADDRESS_HERE';

let connectedEvmAddress = null;
let connectedSolAddress = null;

/**
 * Connect wallet based on selected payment method
 */
async function connectWallet() {
  const method = getSelectedPaymentMethod();
  if (method === 'evm') {
    await connectEvmWallet();
  } else if (method === 'solana') {
    await connectSolanaWallet();
  }
}

/**
 * Connect EVM wallet via window.ethereum (MetaMask etc.)
 */
async function connectEvmWallet() {
  if (!window.ethereum) {
    showNotification('Please install MetaMask or an EVM wallet', 'error');
    return;
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    connectedEvmAddress = accounts[0];
    const shortAddr = connectedEvmAddress.slice(0, 6) + '...' + connectedEvmAddress.slice(-4);

    const btn = document.getElementById('connectWalletBtn');
    if (btn) {
      btn.textContent = `✓ Connected: ${shortAddr}`;
      btn.style.borderColor = 'var(--success)';
      btn.style.color = 'var(--success)';
    }

    // Show chain info
    const chainId = parseInt(await window.ethereum.request({ method: 'eth_chainId' }), 16);
    const chainNames = { 1: 'Ethereum', 43114: 'Avalanche', 8453: 'Base', 137: 'Polygon', 10: 'Optimism', 42161: 'Arbitrum' };
    const chainName = chainNames[chainId] || `Chain ${chainId}`;
    showNotification(`Connected to ${chainName} as ${shortAddr}`);

  } catch (err) {
    console.error('EVM connect error:', err);
    showNotification('Wallet connection failed', 'error');
  }
}

/**
 * Process EVM USDC payment
 */
async function processEvmPayment() {
  if (!connectedEvmAddress) {
    showNotification('Please connect your wallet first', 'error');
    return;
  }

  if (MERCHANT_EVM_ADDRESS.startsWith('0xYOUR')) {
    showNotification('Merchant wallet not configured yet', 'error');
    return;
  }

  const btn = document.getElementById('confirmPayBtn');
  const origText = btn.textContent;
  btn.textContent = 'Confirm in wallet...';
  btn.disabled = true;

  try {
    const chainId = parseInt(await window.ethereum.request({ method: 'eth_chainId' }), 16);
    const usdcAddress = USDC_CONTRACTS[chainId];

    if (!usdcAddress) {
      throw new Error('USDC not supported on this chain. Please switch to Ethereum, Avalanche, Base, or Polygon.');
    }

    const total = getCartTotal() + 5; // + shipping
    const amount = BigInt(Math.round(total * 1e6)); // USDC has 6 decimals

    // ERC-20 transfer function signature
    const transferData = '0xa9059cbb'
      + MERCHANT_EVM_ADDRESS.slice(2).padStart(64, '0')
      + amount.toString(16).padStart(64, '0');

    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: connectedEvmAddress,
        to: usdcAddress,
        data: transferData,
      }],
    });

    showNotification('Payment sent! TX: ' + txHash.slice(0, 10) + '...');
    cart = [];
    renderCart();
    window.location.hash = '#/success';

  } catch (err) {
    console.error('EVM payment error:', err);
    showNotification(err.message || 'Payment failed', 'error');
  } finally {
    btn.textContent = origText;
    btn.disabled = false;
  }
}

// ═══════════════════════════════════════════════════════════════
// SOLANA WALLET (Phantom / Solflare)
// ═══════════════════════════════════════════════════════════════

/**
 * Connect Solana wallet via window.solana (Phantom etc.)
 */
async function connectSolanaWallet() {
  const provider = window.phantom?.solana || window.solana;

  if (!provider) {
    showNotification('Please install Phantom or a Solana wallet', 'error');
    return;
  }

  try {
    const resp = await provider.connect();
    connectedSolAddress = resp.publicKey.toString();
    const shortAddr = connectedSolAddress.slice(0, 4) + '...' + connectedSolAddress.slice(-4);

    const btn = document.getElementById('connectWalletBtn');
    if (btn) {
      btn.textContent = `✓ Connected: ${shortAddr}`;
      btn.style.borderColor = 'var(--success)';
      btn.style.color = 'var(--success)';
    }

    showNotification(`Solana wallet connected: ${shortAddr}`);
  } catch (err) {
    console.error('Solana connect error:', err);
    showNotification('Wallet connection failed', 'error');
  }
}

/**
 * Process Solana USDC payment
 * Note: Full implementation requires @solana/web3.js and @solana/spl-token
 * loaded via CDN in index.html for production use
 */
async function processSolanaPayment() {
  if (!connectedSolAddress) {
    showNotification('Please connect your Solana wallet first', 'error');
    return;
  }

  if (MERCHANT_SOL_ADDRESS.startsWith('YOUR_')) {
    showNotification('Merchant Solana wallet not configured yet', 'error');
    return;
  }

  // Solana USDC transfer requires @solana/web3.js + spl-token
  // This will be fully implemented when CDN libraries are loaded
  showNotification('Solana payment: confirming in wallet...');

  // Placeholder for full SPL token transfer logic
  // In production, this uses:
  // 1. Connection to Solana mainnet-beta
  // 2. getOrCreateAssociatedTokenAccount
  // 3. createTransferInstruction for USDC SPL token
  // 4. provider.signAndSendTransaction
  showNotification('Solana USDC transfer will be finalized after CDN setup', 'error');
}
