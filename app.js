class ShoppingCart { constructor() { this.items = this.loadFromStorage(); } addItem(product) { const existingItem = this.items.find(item => item.id === product.id); if (existingItem) { existingItem.quantity++; } else { this.items.push({...product, quantity: 1}); } this.saveToStorage(); this.updateUI(); } removeItem(productId) { this.items = this.items.filter(item => item.id !== productId); this.saveToStorage(); this.updateUI(); } updateQuantity(productId, quantity) { const item = this.items.find(item => item.id === productId); if (item) { if (quantity <= 0) { this.removeItem(productId); } else { item.quantity = quantity; this.saveToStorage(); this.updateUI(); } } } getTotal() { return this.items.reduce((total, item) => total + (item.price * item.quantity), 0); } getItemCount() { return this.items.reduce((count, item) => count + item.quantity, 0); } saveToStorage() { localStorage.setItem('cart', JSON.stringify(this.items)); } loadFromStorage() { const saved = localStorage.getItem('cart'); return saved ? JSON.parse(saved) : []; } clear() { this.items = []; this.saveToStorage(); this.updateUI(); } updateUI() { document.getElementById('cartCount').textContent = this.getItemCount(); } }
const cart = new ShoppingCart();
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const brandFilter = document.getElementById('brandFilter');
const priceFilter = document.getElementById('priceFilter');
const priceValue = document.getElementById('priceValue');
const colorFilter = document.getElementById('colorFilter');
const resetFilters = document.getElementById('resetFilters');
const productsGrid = document.getElementById('productsGrid');
const cartBtn = document.getElementById('cartBtn');
const cartModal = document.getElementById('cartModal');
const productModal = document.getElementById('productModal');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const closeButtons = document.querySelectorAll('.close');
let allProducts = getSneakers();
let filteredProducts = [...allProducts];
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });
brandFilter.addEventListener('change', applyFilters);
priceFilter.addEventListener('input', updatePriceDisplay);
colorFilter.addEventListener('change', applyFilters);
resetFilters.addEventListener('click', clearFilters);
cartBtn.addEventListener('click', openCartModal);
checkoutBtn.addEventListener('click', checkout);
closeButtons.forEach(btn => { btn.addEventListener('click', (e) => { e.target.closest('.modal').classList.add('hidden'); }); });
window.addEventListener('click', (e) => { if (e.target.classList.contains('modal')) { e.target.classList.add('hidden'); } });
function performSearch() { const query = searchInput.value; if (query.trim()) { filteredProducts = searchSneakers(query); } else { filteredProducts = [...allProducts]; } applyFilters(); renderProducts(filteredProducts); }
function applyFilters() { let results = filteredProducts; const selectedBrand = brandFilter.value; if (selectedBrand) { results = results.filter(p => p.brand === selectedBrand); } const maxPrice = parseFloat(priceFilter.value); results = results.filter(p => p.price <= maxPrice); const selectedColor = colorFilter.value; if (selectedColor) { results = results.filter(p => p.color.toLowerCase().includes(selectedColor.toLowerCase())); } renderProducts(results); }
function updatePriceDisplay() { priceValue.textContent = '$' + priceFilter.value; applyFilters(); }
function clearFilters() { searchInput.value = ''; brandFilter.value = ''; priceFilter.value = '500'; colorFilter.value = ''; priceValue.textContent = '$500'; filteredProducts = [...allProducts]; renderProducts(filteredProducts); }
function renderProducts(products) { productsGrid.innerHTML = ''; if (products.length === 0) { productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999; font-size: 18px;">No se encontraron zapatillas 😔</p>'; return; } products.forEach(product => { const productCard = document.createElement('div'); productCard.className = 'product-card'; productCard.innerHTML = `<div class="product-image">${product.emoji}</div><div class="product-info"><div class="product-brand">${product.brand}</div><div class="product-name">${product.name}</div><div class="product-price">$${product.price.toFixed(2)}</div><div class="product-color">Color: ${product.color}</div><div class="product-size">Tallas: ${product.size}</div><button class="btn-add-cart" onclick="addToCart(${product.id})">🛒 Añadir</button><button class="btn-view-details" onclick="showProductDetail(${product.id})">Detalles</button></div>`; productsGrid.appendChild(productCard); }); }
function addToCart(productId) { const product = allProducts.find(p => p.id === productId); if (product) { cart.addItem(product); showNotification(`✅ "${product.name}" añadido al carrito!`); } }
function showNotification(message) { const notification = document.createElement('div'); notification.className = 'success-message'; notification.textContent = message; document.body.appendChild(notification); setTimeout(() => { notification.remove(); }, 3000); }
function openCartModal() { cartModal.classList.remove('hidden'); renderCartItems(); }
function renderCartItems() { cartItems.innerHTML = ''; if (cart.items.length === 0) { cartItems.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">Tu carrito está vacío 🛒</div>'; cartTotal.textContent = '0.00'; return; } cart.items.forEach(item => { const cartItem = document.createElement('div'); cartItem.className = 'cart-item'; cartItem.innerHTML = `<div class="cart-item-info"><div><strong>${item.name}</strong></div><div>$${item.price.toFixed(2)} x ${item.quantity}</div></div><div class="cart-item-quantity"><button onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">−</button><span>${item.quantity}</span><button onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button></div><button class="btn-remove" onclick="cart.removeItem(${item.id})">❌</button>`; cartItems.appendChild(cartItem); }); cartTotal.textContent = cart.getTotal().toFixed(2); }
function checkout() { if (cart.items.length === 0) { alert('Tu carrito está vacío'); return; } const total = cart.getTotal().toFixed(2); const itemCount = cart.getItemCount(); alert(`¡Gracias por tu compra! 🎉\n\nTotal: $${total}\nArtículos: ${itemCount}`); cart.clear(); cartModal.classList.add('hidden'); showNotification('¡Pedido completado! 🎉'); }
function showProductDetail(productId) { const product = allProducts.find(p => p.id === productId); if (!product) return; const productDetail = document.getElementById('productDetail'); productDetail.innerHTML = `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;"><div style="font-size: 100px; text-align: center;">${product.emoji}</div><div><h2>${product.name}</h2><p style="color: #666; font-size: 18px;">${product.brand}</p><h3 style="color: #FF6B35;">$${product.price.toFixed(2)}</h3><p><strong>Color:</strong> ${product.color}</p><p><strong>Tallas:</strong> ${product.size}</p><p><strong>⭐ ${product.rating}/5</strong></p><button class="btn-checkout" onclick="addToCart(${product.id}); productModal.classList.add('hidden');">Añadir al carrito</button></div></div>`; productModal.classList.remove('hidden'); }
function initializeFilters() { getBrands().forEach(brand => { const option = document.createElement('option'); option.value = brand; option.textContent = brand; brandFilter.appendChild(option); }); getColors().forEach(color => { const option = document.createElement('option'); option.value = color; option.textContent = color; colorFilter.appendChild(option); }); }
function init() { initializeFilters(); renderProducts(allProducts); cart.updateUI(); }
init();