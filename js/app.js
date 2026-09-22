import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─────────────────────────────────────────────
// Catalog
// ─────────────────────────────────────────────
const PRODUCTS = [
  { id: 'coca-cola-250', name: 'Coca-Cola', size: '250 ml can', category: 'cola', price: 40, tint: '#E31C23', shape: 'can' },
  { id: 'thums-up-250', name: 'Thums Up', size: '250 ml can', category: 'cola', price: 40, tint: '#1A1A1A', shape: 'can' },
  { id: 'pepsi-250', name: 'Pepsi', size: '250 ml can', category: 'cola', price: 40, tint: '#004B93', shape: 'can' },
  { id: 'campa-cola-250', name: 'Campa Cola', size: '250 ml bottle', category: 'cola', price: 20, tint: '#C41E3A', shape: 'bottle' },
  { id: 'limca-250', name: 'Limca', size: '250 ml can', category: 'lemon-soda', price: 40, tint: '#7CB342', shape: 'can' },
  { id: 'sprite-250', name: 'Sprite', size: '250 ml can', category: 'lemon-soda', price: 40, tint: '#00A651', shape: 'can' },
  { id: '7up-250', name: '7Up', size: '250 ml can', category: 'lemon-soda', price: 40, tint: '#00A651', shape: 'can' },
  { id: 'mountain-dew-250', name: 'Mountain Dew', size: '250 ml can', category: 'lemon-soda', price: 40, tint: '#5E8C1A', shape: 'can' },
  { id: 'appy-fizz-250', name: 'Appy Fizz', size: '250 ml bottle', category: 'juice', price: 40, tint: '#E85D04', shape: 'bottle' },
  { id: 'maaza-250', name: 'Maaza', size: '250 ml tetra', category: 'juice', price: 30, tint: '#F4A261', shape: 'tetra' },
  { id: 'frooti-200', name: 'Frooti', size: '200 ml tetra', category: 'juice', price: 20, tint: '#E9C46A', shape: 'tetra' },
  { id: 'slice-250', name: 'Slice', size: '250 ml bottle', category: 'juice', price: 35, tint: '#E76F51', shape: 'bottle' },
  { id: 'real-mixed-200', name: 'Real Fruit Power', size: '200 ml tetra', category: 'juice', price: 25, tint: '#2A9D8F', shape: 'tetra' },
  { id: 'paperboat-aamras-200', name: 'Paper Boat Aamras', size: '200 ml pouch', category: 'juice', price: 30, tint: '#E9C46A', shape: 'pouch' },
  { id: 'bovonto-250', name: 'Bovonto', size: '250 ml bottle', category: 'cola', price: 30, tint: '#9B2226', shape: 'bottle' },
  { id: 'redbull-250', name: 'Red Bull', size: '250 ml can', category: 'energy', price: 125, tint: '#0033A0', shape: 'can' },
  { id: 'monster-350', name: 'Monster Energy', size: '350 ml can', category: 'energy', price: 110, tint: '#1A1A1A', shape: 'can' },
  { id: 'sting-250', name: 'Sting', size: '250 ml can', category: 'energy', price: 20, tint: '#D00000', shape: 'can' },
  { id: 'bisleri-1l', name: 'Bisleri Water', size: '1 L bottle', category: 'water', price: 20, tint: '#48CAE4', shape: 'bottle' },
  { id: 'bailley-1l', name: 'Bailley Water', size: '1 L bottle', category: 'water', price: 20, tint: '#90E0EF', shape: 'bottle' },
  { id: 'amul-kool-200', name: 'Amul Kool', size: '200 ml tetra', category: 'flavoured-milk', price: 25, tint: '#E63946', shape: 'tetra' },
];

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem('chilldrop-cart') || '[]');
let currentFilter = 'all';
let previewProduct = null;
let heroScene, heroCamera, heroRenderer, heroBottles = [];
let previewScene, previewCamera, previewRenderer, previewMesh, previewControls;
let isDraggingPreview = false;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatPrice(p) { return `₹${p}`; }

function saveCart() {
  localStorage.setItem('chilldrop-cart', JSON.stringify(cart));
  updateCartUI();
}

function getCartCount() {
  return cart.reduce((s, i) => s + i.qty, 0);
}

function getCartTotal() {
  return cart.reduce((s, i) => {
    const p = PRODUCTS.find(x => x.id === i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.remove('opacity-0', 'translate-y-4');
  t.classList.add('opacity-100', 'translate-y-0');
  setTimeout(() => {
    t.classList.add('opacity-0', 'translate-y-4');
    t.classList.remove('opacity-100', 'translate-y-0');
  }, 2200);
}

// ─────────────────────────────────────────────
// 3D: Simple bottle / can geometry
// ─────────────────────────────────────────────
function createDrinkMesh(product, scale = 1) {
  const group = new THREE.Group();
  const color = new THREE.Color(product.tint);

  if (product.shape === 'can') {
    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.38 * scale, 0.38 * scale, 1.1 * scale, 32);
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.55,
      roughness: 0.25,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0;
    group.add(body);

    // Top lid
    const lidGeo = new THREE.CylinderGeometry(0.39 * scale, 0.39 * scale, 0.06 * scale, 32);
    const lidMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.y = 0.58 * scale;
    group.add(lid);

    // Label band (slightly different shade)
    const bandGeo = new THREE.CylinderGeometry(0.385 * scale, 0.385 * scale, 0.45 * scale, 32);
    const bandMat = new THREE.MeshStandardMaterial({
      color: color.clone().offsetHSL(0, 0, -0.08),
      metalness: 0.4,
      roughness: 0.35,
    });
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.y = -0.05 * scale;
    group.add(band);

  } else if (product.shape === 'bottle') {
    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.32 * scale, 0.36 * scale, 1.0 * scale, 24);
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.15,
      roughness: 0.35,
      transparent: true,
      opacity: 0.92,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = -0.1 * scale;
    group.add(body);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.14 * scale, 0.18 * scale, 0.35 * scale, 16);
    const neck = new THREE.Mesh(neckGeo, bodyMat);
    neck.position.y = 0.55 * scale;
    group.add(neck);

    // Cap
    const capGeo = new THREE.CylinderGeometry(0.16 * scale, 0.16 * scale, 0.12 * scale, 16);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.3, roughness: 0.5 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.78 * scale;
    group.add(cap);

  } else {
    // Tetra / pouch approximation — rounded box
    const geo = new THREE.BoxGeometry(0.55 * scale, 0.95 * scale, 0.28 * scale);
    const mat = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.1,
      roughness: 0.5,
    });
    const box = new THREE.Mesh(geo, mat);
    group.add(box);
  }

  // Soft shadow plane helper (invisible, for contact)
  group.userData.productId = product.id;
  return group;
}

// ─────────────────────────────────────────────
// Hero 3D scene
// ─────────────────────────────────────────────
function initHero() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  heroScene = new THREE.Scene();
  heroCamera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
  heroCamera.position.set(0, 0, 5.5);

  heroRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  heroRenderer.setSize(w, h);
  heroRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  heroRenderer.setClearColor(0x000000, 0);

  // Lights
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(3, 4, 5);
  heroScene.add(key);
  const rim = new THREE.DirectionalLight(0x88aacc, 0.6);
  rim.position.set(-3, 1, -2);
  heroScene.add(rim);
  heroScene.add(new THREE.AmbientLight(0x404860, 0.7));

  // Pick a subset of products for the drift
  const heroProducts = PRODUCTS.filter(p => ['can', 'bottle'].includes(p.shape)).slice(0, 12);

  heroProducts.forEach((p, i) => {
    const mesh = createDrinkMesh(p, 0.55);
    // Random position inside a sphere-ish bound
    const theta = (i / heroProducts.length) * Math.PI * 2;
    const r = 0.9 + Math.random() * 0.9;
    mesh.position.set(
      Math.cos(theta) * r * 0.9,
      (Math.random() - 0.5) * 1.8,
      Math.sin(theta) * r * 0.6
    );
    mesh.rotation.set(
      Math.random() * 0.6 - 0.3,
      Math.random() * Math.PI * 2,
      Math.random() * 0.4 - 0.2
    );
    mesh.userData = {
      basePos: mesh.position.clone(),
      rotSpeed: (Math.random() - 0.5) * 0.008,
      floatAmp: 0.12 + Math.random() * 0.1,
      floatSpeed: 0.4 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
    };
    heroScene.add(mesh);
    heroBottles.push(mesh);
  });

  // Mouse parallax
  let mouseX = 0, mouseY = 0;
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 0.6;
    mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 0.4;
  });

  let t = 0;
  function animateHero() {
    requestAnimationFrame(animateHero);
    t += 0.016;
    heroBottles.forEach((m) => {
      const u = m.userData;
      m.position.y = u.basePos.y + Math.sin(t * u.floatSpeed + u.phase) * u.floatAmp;
      m.rotation.y += u.rotSpeed;
      m.rotation.x += u.rotSpeed * 0.3;
    });
    // Gentle camera parallax
    heroCamera.position.x += (mouseX - heroCamera.position.x) * 0.05;
    heroCamera.position.y += (-mouseY - heroCamera.position.y) * 0.05;
    heroCamera.lookAt(0, 0, 0);
    heroRenderer.render(heroScene, heroCamera);
  }
  animateHero();

  // Resize
  window.addEventListener('resize', () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    heroCamera.aspect = w / h;
    heroCamera.updateProjectionMatrix();
    heroRenderer.setSize(w, h);
  });
}

// ─────────────────────────────────────────────
// Preview 3D scene
// ─────────────────────────────────────────────
function initPreview() {
  const canvas = document.getElementById('preview-canvas');
  if (!canvas) return;

  const w = canvas.clientWidth || 400;
  const h = canvas.clientHeight || 288;

  previewScene = new THREE.Scene();
  previewCamera = new THREE.PerspectiveCamera(35, w / h, 0.1, 50);
  previewCamera.position.set(0, 0.2, 3.2);

  previewRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  previewRenderer.setSize(w, h);
  previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  previewRenderer.setClearColor(0x0B141F, 1);

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(2.5, 3, 4);
  previewScene.add(key);
  const rim = new THREE.DirectionalLight(0xaaccff, 0.5);
  rim.position.set(-2, 1, -2);
  previewScene.add(rim);
  previewScene.add(new THREE.AmbientLight(0x506080, 0.6));

  // Soft ground
  const groundGeo = new THREE.CircleGeometry(1.5, 32);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x0a121c, roughness: 0.9 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.7;
  previewScene.add(ground);

  previewControls = new OrbitControls(previewCamera, canvas);
  previewControls.enableDamping = true;
  previewControls.dampingFactor = 0.08;
  previewControls.enableZoom = false;
  previewControls.enablePan = false;
  previewControls.autoRotate = true;
  previewControls.autoRotateSpeed = 1.8;
  previewControls.minPolarAngle = Math.PI / 3;
  previewControls.maxPolarAngle = Math.PI / 1.6;

  // Pause auto-rotate on interaction
  canvas.addEventListener('pointerdown', () => {
    previewControls.autoRotate = false;
    isDraggingPreview = true;
  });
  window.addEventListener('pointerup', () => {
    if (isDraggingPreview) {
      isDraggingPreview = false;
      setTimeout(() => { if (previewControls) previewControls.autoRotate = true; }, 1800);
    }
  });

  function animatePreview() {
    requestAnimationFrame(animatePreview);
    if (previewControls) previewControls.update();
    if (previewRenderer && previewScene && previewCamera) {
      previewRenderer.render(previewScene, previewCamera);
    }
  }
  animatePreview();
}

function showPreview(product) {
  previewProduct = product;
  document.getElementById('preview-name').textContent = product.name;
  document.getElementById('preview-meta').textContent = `${product.size} · ${product.category.replace('-', ' ')}`;
  document.getElementById('preview-price').textContent = formatPrice(product.price);

  // Clear previous mesh
  if (previewMesh) {
    previewScene.remove(previewMesh);
    previewMesh.traverse(c => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    });
  }

  previewMesh = createDrinkMesh(product, 1.0);
  previewMesh.position.y = -0.15;
  previewScene.add(previewMesh);

  // Reset camera
  previewCamera.position.set(0, 0.2, 3.2);
  previewControls.target.set(0, 0, 0);
  previewControls.autoRotate = true;

  const modal = document.getElementById('preview-modal');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Resize renderer to current canvas size
  const canvas = document.getElementById('preview-canvas');
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  previewCamera.aspect = w / h;
  previewCamera.updateProjectionMatrix();
  previewRenderer.setSize(w, h);
}

function hidePreview() {
  document.getElementById('preview-modal').classList.add('hidden');
  document.body.style.overflow = '';
  previewProduct = null;
}

// ─────────────────────────────────────────────
// Product grid
// ─────────────────────────────────────────────
function renderProducts() {
  const grid = document.getElementById('product-grid');
  const filtered = currentFilter === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === currentFilter);

  // Group into shelf rows of ~4-5
  const rows = [];
  for (let i = 0; i < filtered.length; i += 5) {
    rows.push(filtered.slice(i, i + 5));
  }

  grid.innerHTML = rows.map(row => `
    <div class="shelf-row rounded-lg p-4 sm:p-5">
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        ${row.map(p => `
          <button
            data-id="${p.id}"
            class="product-tile group text-left p-3 rounded-lg hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-tangerine/50"
          >
            <div class="flex items-start gap-3">
              <div class="swatch shrink-0" style="background: linear-gradient(160deg, ${p.tint} 0%, ${adjustColor(p.tint, -30)} 100%);"></div>
              <div class="min-w-0">
                <p class="font-display font-semibold text-sm truncate group-hover:text-lime transition-colors">${p.name}</p>
                <p class="text-xs text-steel mt-0.5">${p.size}</p>
                <p class="font-display font-bold text-tangerine mt-1">${formatPrice(p.price)}</p>
              </div>
            </div>
          </button>
        `).join('')}
      </div>
    </div>
  `).join('');

  // Bind clicks
  grid.querySelectorAll('.product-tile').forEach(el => {
    el.addEventListener('click', () => {
      const p = PRODUCTS.find(x => x.id === el.dataset.id);
      if (p) showPreview(p);
    });
  });
}

function adjustColor(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ─────────────────────────────────────────────
// Cart
// ─────────────────────────────────────────────
function updateCartUI() {
  const count = getCartCount();
  const badge = document.getElementById('cart-count');
  if (count > 0) {
    badge.textContent = count > 9 ? '9+' : count;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  const itemsEl = document.getElementById('cart-items');
  const footer = document.getElementById('cart-footer');
  const empty = document.getElementById('cart-empty');

  if (cart.length === 0) {
    itemsEl.innerHTML = '';
    footer.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  footer.classList.remove('hidden');

  itemsEl.innerHTML = cart.map(item => {
    const p = PRODUCTS.find(x => x.id === item.id);
    if (!p) return '';
    return `
      <div class="flex items-center gap-3 bg-white/5 rounded-lg p-3">
        <div class="swatch shrink-0 w-10 h-14" style="background: linear-gradient(160deg, ${p.tint} 0%, ${adjustColor(p.tint, -30)} 100%);"></div>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-sm truncate">${p.name}</p>
          <p class="text-xs text-steel">${p.size}</p>
          <p class="text-sm font-semibold text-lime mt-0.5">${formatPrice(p.price)}</p>
        </div>
        <div class="flex items-center gap-2">
          <button data-action="dec" data-id="${p.id}" class="w-7 h-7 rounded bg-white/10 hover:bg-white/20 text-sm font-bold">−</button>
          <span class="w-6 text-center text-sm font-medium">${item.qty}</span>
          <button data-action="inc" data-id="${p.id}" class="w-7 h-7 rounded bg-white/10 hover:bg-white/20 text-sm font-bold">+</button>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('cart-total').textContent = formatPrice(getCartTotal());

  itemsEl.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const entry = cart.find(c => c.id === id);
      if (!entry) return;
      if (action === 'inc') entry.qty += 1;
      if (action === 'dec') {
        entry.qty -= 1;
        if (entry.qty <= 0) cart = cart.filter(c => c.id !== id);
      }
      saveCart();
    });
  });
}

function addToCart(product, sourceEl = null) {
  const existing = cart.find(c => c.id === product.id);
  if (existing) existing.qty += 1;
  else cart.push({ id: product.id, qty: 1 });
  saveCart();
  showToast(`${product.name} added`);

  // Flying animation
  if (sourceEl) {
    flyToCart(sourceEl, product.tint);
  }
}

function flyToCart(sourceEl, tint) {
  const cartBtn = document.getElementById('cart-btn');
  const from = sourceEl.getBoundingClientRect();
  const to = cartBtn.getBoundingClientRect();

  const flyer = document.createElement('div');
  flyer.className = 'flying-item';
  flyer.style.background = `linear-gradient(160deg, ${tint} 0%, ${adjustColor(tint, -30)} 100%)`;
  flyer.style.left = `${from.left + from.width / 2 - 20}px`;
  flyer.style.top = `${from.top + from.height / 2 - 30}px`;
  document.body.appendChild(flyer);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);

  gsap.to(flyer, {
    duration: 0.7,
    x: dx,
    y: dy,
    scale: 0.3,
    opacity: 0.4,
    ease: 'power2.in',
    onComplete: () => flyer.remove(),
  });
}

function openCart() {
  document.getElementById('cart-drawer').classList.remove('translate-x-full');
  const overlay = document.getElementById('cart-overlay');
  overlay.classList.remove('hidden');
  requestAnimationFrame(() => overlay.classList.add('opacity-100'));
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-drawer').classList.add('translate-x-full');
  const overlay = document.getElementById('cart-overlay');
  overlay.classList.remove('opacity-100');
  setTimeout(() => overlay.classList.add('hidden'), 300);
  document.body.style.overflow = '';
}

// ─────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────
function init() {
  renderProducts();
  updateCartUI();
  initHero();
  initPreview();

  // Filters
  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(b => {
        b.classList.remove('active', 'bg-tangerine', 'text-ink');
        b.classList.add('bg-white/5', 'text-steel');
      });
      btn.classList.add('active');
      btn.classList.remove('bg-white/5', 'text-steel');
      currentFilter = btn.dataset.filter;
      renderProducts();
    });
  });

  // Cart open/close
  document.getElementById('cart-btn').addEventListener('click', openCart);
  document.getElementById('close-cart').addEventListener('click', closeCart);
  document.getElementById('cart-overlay').addEventListener('click', closeCart);

  // Preview close + add
  document.getElementById('close-preview').addEventListener('click', hidePreview);
  document.querySelector('#preview-modal .modal-backdrop').addEventListener('click', hidePreview);
  document.getElementById('preview-add').addEventListener('click', () => {
    if (previewProduct) {
      addToCart(previewProduct, document.getElementById('preview-add'));
      hidePreview();
    }
  });

  // Checkout → WhatsApp
  document.getElementById('checkout-btn').addEventListener('click', () => {
    if (cart.length === 0) return;
    const lines = cart.map(item => {
      const p = PRODUCTS.find(x => x.id === item.id);
      return `• ${p.name} (${p.size}) × ${item.qty} = ₹${p.price * item.qty}`;
    });
    const total = getCartTotal();
    const text = encodeURIComponent(
      `Hi ChillDrop! I'd like to order:\n\n${lines.join('\n')}\n\nTotal: ₹${total}\n\nDelivery address: `
    );
    window.open(`https://wa.me/918817999746?text=${text}`, '_blank');
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hidePreview();
      closeCart();
    }
  });
}

// Wait for DOM + fonts
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
