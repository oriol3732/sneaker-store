class ShoppingCart {
    constructor() {
        this.items = this.loadFromStorage();
    }

    addItem(product) {
        const existingItem = this.items.find((item) => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({ ...product, quantity: 1 });
        }

        this.saveToStorage();
        this.updateUI();
    }

    removeItem(productId) {
        this.items = this.items.filter((item) => item.id !== productId);
        this.saveToStorage();
        this.updateUI();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find((entry) => entry.id === productId);

        if (!item) {
            return;
        }

        if (quantity <= 0) {
            this.removeItem(productId);
            return;
        }

        item.quantity = quantity;
        this.saveToStorage();
        this.updateUI();
    }

    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    saveToStorage() {
        localStorage.setItem("cart", JSON.stringify(this.items));
    }

    loadFromStorage() {
        const saved = localStorage.getItem("cart");
        return saved ? JSON.parse(saved) : [];
    }

    clear() {
        this.items = [];
        this.saveToStorage();
        this.updateUI();
    }

    updateUI() {
        document.getElementById("cartCount").textContent = this.getItemCount();
    }
}

const cart = new ShoppingCart();

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const brandFilter = document.getElementById("brandFilter");
const priceFilter = document.getElementById("priceFilter");
const priceValue = document.getElementById("priceValue");
const colorFilter = document.getElementById("colorFilter");
const resetFilters = document.getElementById("resetFilters");
const pageSizeSelect = document.getElementById("pageSizeSelect");
const prevPage = document.getElementById("prevPage");
const nextPage = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");
const heroFilterBtn = document.getElementById("heroFilterBtn");
const productsGrid = document.getElementById("productsGrid");
const cartBtn = document.getElementById("cartBtn");
const cartModal = document.getElementById("cartModal");
const productModal = document.getElementById("productModal");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const closeButtons = document.querySelectorAll(".close");
const resultsSummary = document.getElementById("resultsSummary");
const productCount = document.getElementById("productCount");
const brandCount = document.getElementById("brandCount");
const featuredCount = document.getElementById("featuredCount");
const productsSection = document.getElementById("productsSection");

const allProducts = getSneakers();
let searchedProducts = [...allProducts];
let currentPage = 1;
let currentPageSize = Number(pageSizeSelect.value);
let currentResults = [...allProducts];
const imageUrlCache = new Map();
const productPhotoPack = [
    "assets/products/real-sport-bball-01.png",
    "assets/products/real-lowtop-01.png",
    "assets/products/real-lowtop-02.png",
    "assets/products/real-sport-bball-02.png",
    "assets/products/real-01.png",
    "assets/products/real-02.png",
    "assets/products/real-03.png",
    "assets/products/real-04.png",
    "assets/products/real-05.png",
    "assets/products/real-06.png",
];

searchBtn.addEventListener("click", performSearch);
searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        performSearch();
    }
});
brandFilter.addEventListener("change", applyFilters);
priceFilter.addEventListener("input", updatePriceDisplay);
colorFilter.addEventListener("change", applyFilters);
resetFilters.addEventListener("click", clearFilters);
pageSizeSelect.addEventListener("change", () => {
    currentPageSize = Number(pageSizeSelect.value);
    currentPage = 1;
    applyFilters({ scrollToTop: false });
});
prevPage.addEventListener("click", () => {
    if (currentPage <= 1) {
        return;
    }

    currentPage -= 1;
    renderProducts(currentResults);
});
nextPage.addEventListener("click", () => {
    const totalPages = Math.ceil(currentResults.length / currentPageSize);

    if (currentPage >= totalPages) {
        return;
    }

    currentPage += 1;
    renderProducts(currentResults);
});
heroFilterBtn.addEventListener("click", () => {
    document.querySelector(".filters").scrollIntoView({ behavior: "smooth", block: "center" });
    brandFilter.focus();
});
cartBtn.addEventListener("click", openCartModal);
checkoutBtn.addEventListener("click", checkout);

closeButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
        event.target.closest(".modal").classList.add("hidden");
    });
});

window.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal")) {
        event.target.classList.add("hidden");
    }
});

function getProductMark(product) {
    const tokens = product.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((token) => token[0]?.toUpperCase() || "");

    const initials = tokens.join("");
    return initials || product.brand.slice(0, 2).toUpperCase();
}

function getProductImagePath(product) {
    const packImage = productPhotoPack[(product.id - 1) % productPhotoPack.length];

    return product.image || packImage || `assets/products/${String(product.id).padStart(3, "0")}-${product.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")}.svg`;
}

function getImagePlaceholder() {
    return "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
}

async function resolveProductImageUrl(product) {
    if (imageUrlCache.has(product.id)) {
        return imageUrlCache.get(product.id);
    }

    const query = product.searchQuery || `${product.brand} ${product.name}`;
    const url = await getSneakerImage(query);
    imageUrlCache.set(product.id, url);
    return url;
}

function loadImageSource(image, card, source) {
    return new Promise((resolve, reject) => {
        image.addEventListener("load", () => {
            card.classList.add("has-image");
            card.classList.remove("image-error");
            resolve(source);
        }, { once: true });
        image.addEventListener("error", () => {
            card.classList.remove("has-image");
            reject(new Error(source));
        }, { once: true });
        image.src = source;
    });
}

async function hydrateProductImage(card, product, selector) {
    const image = card.querySelector(selector);

    if (!image) {
        return;
    }

    try {
        await loadImageSource(image, card, getProductImagePath(product));
        return;
    } catch (_) {
        // Fall back to the remote image source below.
    }

    const url = await resolveProductImageUrl(product);

    if (!url) {
        card.classList.add("image-error");
        return;
    }

    try {
        await loadImageSource(image, card, url);
    } catch (_) {
        card.classList.add("image-error");
    }
}

function updateHeroStats() {
    productCount.textContent = allProducts.length;
    brandCount.textContent = getBrands().length;
    featuredCount.textContent = allProducts.filter((product) => product.price >= 150).length;
}

function updateResultsSummary(products) {
    const maxPrice = Number(priceFilter.value);
    const activeBrand = brandFilter.value || "todas las marcas";
    const activeTone = colorFilter.value || "todos los tonos";
    const totalPages = Math.max(1, Math.ceil(products.length / currentPageSize));

    if (products.length === 0) {
        resultsSummary.textContent = `0 resultados dentro de ${activeBrand}, hasta $${maxPrice}, en ${activeTone}.`;
        pageInfo.textContent = "0 / 0";
        prevPage.disabled = true;
        nextPage.disabled = true;
        return;
    }

    const safePage = Math.min(currentPage, totalPages);
    const startItem = ((safePage - 1) * currentPageSize) + 1;
    const endItem = Math.min(safePage * currentPageSize, products.length);

    resultsSummary.textContent = `${products.length} resultados dentro de ${activeBrand}, hasta $${maxPrice}, en ${activeTone}. Mostrando ${startItem}-${endItem}.`;
    pageInfo.textContent = `${safePage} / ${totalPages}`;
    prevPage.disabled = safePage <= 1;
    nextPage.disabled = safePage >= totalPages;
}

function scrollToResults() {
    productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function performSearch() {
    const query = searchInput.value.trim();
    searchedProducts = query ? searchSneakers(query) : [...allProducts];
    applyFilters({ scrollToTop: true });
}

function applyFilters(options = {}) {
    const { scrollToTop = true, resetPage = true } = options;

    if (resetPage) {
        currentPage = 1;
    }

    let results = [...searchedProducts];
    const selectedBrand = brandFilter.value;
    const maxPrice = Number(priceFilter.value);
    const selectedColor = colorFilter.value;

    if (selectedBrand) {
        results = results.filter((product) => product.brand === selectedBrand);
    }

    results = results.filter((product) => product.price <= maxPrice);

    if (selectedColor) {
        results = results.filter((product) =>
            product.color.toLowerCase().includes(selectedColor.toLowerCase())
        );
    }

    currentResults = results;
    renderProducts(currentResults);

    if (scrollToTop) {
        scrollToResults();
    }
}

function updatePriceDisplay() {
    priceValue.textContent = `$${priceFilter.value}`;
    applyFilters({ scrollToTop: true, resetPage: true });
}

function clearFilters() {
    searchInput.value = "";
    brandFilter.value = "";
    priceFilter.value = "500";
    colorFilter.value = "";
    priceValue.textContent = "$500";
    searchedProducts = [...allProducts];
    currentPage = 1;
    currentResults = [...allProducts];
    renderProducts(searchedProducts);
    scrollToResults();
}

function renderProducts(products) {
    currentResults = products;
    const totalPages = Math.max(1, Math.ceil(products.length / currentPageSize));
    currentPage = Math.min(currentPage, totalPages);
    productsGrid.innerHTML = "";
    updateResultsSummary(products);

    if (products.length === 0) {
        productsGrid.innerHTML = `
            <div class="empty-state">
                <p>No se encontraron zapatillas para esta combinación de filtros.</p>
            </div>
        `;
        return;
    }

    const startIndex = (currentPage - 1) * currentPageSize;
    const visibleProducts = products.slice(startIndex, startIndex + currentPageSize);

    visibleProducts.forEach((product) => {
        const productCard = document.createElement("article");
        productCard.className = "product-card";
        productCard.innerHTML = `
            <div class="product-image" aria-hidden="true">
                <img class="product-photo" src="${getImagePlaceholder()}" alt="${product.name}" loading="lazy" decoding="async">
                <div class="product-image-fallback">${getProductMark(product)}</div>
            </div>
            <div class="product-info">
                <div class="product-brand">${product.brand}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-color">Color: ${product.color}</div>
                <div class="product-size">Tallas: ${product.size}</div>
                <div class="product-rating">Calificación: ${product.rating}/5</div>
                <div class="product-actions">
                    <button class="btn-add-cart" onclick="addToCart(${product.id})">Añadir al carrito</button>
                    <button class="btn-view-details" onclick="showProductDetail(${product.id})">Ver detalle</button>
                </div>
            </div>
        `;

        productsGrid.appendChild(productCard);

        hydrateProductImage(productCard, product, ".product-photo");
    });
}

function addToCart(productId) {
    const product = allProducts.find((entry) => entry.id === productId);

    if (!product) {
        return;
    }

    cart.addItem(product);
    showNotification(`"${product.name}" fue añadido al carrito.`);
}

function showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "success-message";
    notification.textContent = message;
    document.body.appendChild(notification);

    window.setTimeout(() => {
        notification.remove();
    }, 2800);
}

function openCartModal() {
    cartModal.classList.remove("hidden");
    renderCartItems();
}

function renderCartItems() {
    cartItems.innerHTML = "";

    if (cart.items.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty">
                Tu carrito está vacío. Elige un par para empezar.
            </div>
        `;
        cartTotal.textContent = "0.00";
        return;
    }

    cart.items.forEach((item) => {
        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)} x ${item.quantity}</div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn" onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn" onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
            </div>
            <button class="btn-remove" onclick="cart.removeItem(${item.id})">Quitar</button>
        `;

        cartItems.appendChild(cartItem);
    });

    cartTotal.textContent = cart.getTotal().toFixed(2);
}

function checkout() {
    if (cart.items.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }

    const total = cart.getTotal().toFixed(2);
    const itemCount = cart.getItemCount();

    alert(`Gracias por tu compra.\n\nTotal: $${total}\nArtículos: ${itemCount}`);
    cart.clear();
    cartModal.classList.add("hidden");
    showNotification("Pedido completado.");
}

function showProductDetail(productId) {
    const product = allProducts.find((entry) => entry.id === productId);

    if (!product) {
        return;
    }

    const productDetail = document.getElementById("productDetail");
    productDetail.innerHTML = `
        <div class="product-detail-image" aria-hidden="true">
            <img class="product-detail-photo" src="${getImagePlaceholder()}" alt="${product.name}" loading="lazy" decoding="async">
            <div class="product-image-fallback">${getProductMark(product)}</div>
        </div>
        <div class="product-detail-info">
            <div class="product-brand product-detail-brand">${product.brand}</div>
            <h2>${product.name}</h2>
            <div class="product-detail-price">$${product.price.toFixed(2)}</div>
            <div class="product-detail-specs">
                <p><strong>Color:</strong> ${product.color}</p>
                <p><strong>Tallas disponibles:</strong> ${product.size}</p>
                <p><strong>Calificación:</strong> ${product.rating}/5</p>
                <p><strong>Selección:</strong> Pensada para una experiencia cuidada y actual.</p>
            </div>
            <button class="btn-add-detail" onclick="addToCart(${product.id}); productModal.classList.add('hidden');">
                Añadir al carrito
            </button>
        </div>
    `;

    productModal.classList.remove("hidden");
    hydrateProductImage(productDetail, product, ".product-detail-photo");
}

function initializeFilters() {
    getBrands().forEach((brand) => {
        const option = document.createElement("option");
        option.value = brand;
        option.textContent = brand;
        brandFilter.appendChild(option);
    });

    getColors().forEach((color) => {
        const option = document.createElement("option");
        option.value = color;
        option.textContent = color;
        colorFilter.appendChild(option);
    });
}

function init() {
    initializeFilters();
    updateHeroStats();
    renderProducts(allProducts);
    cart.updateUI();
}

init();
