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

function updateHeroStats() {
    productCount.textContent = allProducts.length;
    brandCount.textContent = getBrands().length;
    featuredCount.textContent = allProducts.filter((product) => product.price >= 150).length;
}

function updateResultsSummary(products) {
    const maxPrice = Number(priceFilter.value);
    const activeBrand = brandFilter.value || "todas las marcas";
    const activeColor = colorFilter.value || "todos los tonos";

    resultsSummary.textContent = `${products.length} resultados dentro de ${activeBrand}, hasta $${maxPrice}, en ${activeColor}.`;
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
    const { scrollToTop = true } = options;
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

    renderProducts(results);

    if (scrollToTop) {
        scrollToResults();
    }
}

function updatePriceDisplay() {
    priceValue.textContent = `$${priceFilter.value}`;
    applyFilters({ scrollToTop: true });
}

function clearFilters() {
    searchInput.value = "";
    brandFilter.value = "";
    priceFilter.value = "500";
    colorFilter.value = "";
    priceValue.textContent = "$500";
    searchedProducts = [...allProducts];
    renderProducts(searchedProducts);
    scrollToResults();
}

function renderProducts(products) {
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

    products.forEach((product) => {
        const productCard = document.createElement("article");
        productCard.className = "product-card";
        productCard.innerHTML = `
            <div class="product-image" aria-hidden="true">${getProductMark(product)}</div>
            <div class="product-info">
                <div class="product-brand">${product.brand}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-color">Colorway: ${product.color}</div>
                <div class="product-size">Tallas: ${product.size}</div>
                <div class="product-rating">Calificacion: ${product.rating}/5</div>
                <button class="btn-add-cart" onclick="addToCart(${product.id})">Añadir al carrito</button>
                <button class="btn-view-details" onclick="showProductDetail(${product.id})">Ver detalle</button>
            </div>
        `;

        productsGrid.appendChild(productCard);
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
                Tu carrito esta vacio. Elige un par para empezar tu seleccion.
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
        alert("Tu carrito esta vacio.");
        return;
    }

    const total = cart.getTotal().toFixed(2);
    const itemCount = cart.getItemCount();

    alert(`Gracias por tu compra.\n\nTotal: $${total}\nArticulos: ${itemCount}`);
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
        <div class="product-detail-image" aria-hidden="true">${getProductMark(product)}</div>
        <div class="product-detail-info">
            <div class="product-brand product-detail-brand">${product.brand}</div>
            <h2>${product.name}</h2>
            <div class="product-detail-price">$${product.price.toFixed(2)}</div>
            <div class="product-detail-specs">
                <p><strong>Colorway:</strong> ${product.color}</p>
                <p><strong>Tallas disponibles:</strong> ${product.size}</p>
                <p><strong>Calificacion:</strong> ${product.rating}/5</p>
                <p><strong>Seleccion:</strong> Curada para una experiencia premium con caracter nocturno.</p>
            </div>
            <button class="btn-add-detail" onclick="addToCart(${product.id}); productModal.classList.add('hidden');">
                Añadir al carrito
            </button>
        </div>
    `;

    productModal.classList.remove("hidden");
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
