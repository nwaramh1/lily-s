const SUPABASE_URL = "https://eubunbimbxjwiesxcrvd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Ur6ehj1hRCk9QBBzYlqklg_TdmTtgbD";

window.storeSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

let products = [];
let selectedCategory = "All";
function renderProducts(list) {
    const container = document.getElementById("product-list");
    if (!container) return;
    if (list.length === 0) {
        container.innerHTML = "<p>No products match your search.</p>";
        return;}

    container.innerHTML = list.map(function (prod) {
        const stockLabel =
            prod.stock === 0
                ? "Out of Stock"
                : prod.stock <= 5
                    ? "Low Stock"
                    : "In Stock";

        const buttonDisabled = prod.stock === 0 ? "disabled" : "";
        const categoryName =
            prod.category?.category_name || "Uncategorized";

        return `
            <div class="product">
                <h3>${prod.name}</h3>
                <p>${prod.description || ""}</p>
                <p>AED ${Number(prod.price).toLocaleString()}</p>
                <p class="stock">${stockLabel}</p>
                <p>Category: ${categoryName}</p>

                <a href="product-detail.html?id=${prod.product_id}">
                    View Details
                </a><p><button
                        ${buttonDisabled}
                        data-id="${prod.product_id}"
                    >Add to Cart</button></p></div>`;
    }).join("");
  container.querySelectorAll(".product button").forEach(function (button) {
    button.addEventListener("click", function () {
        const productId = Number(button.dataset.id);

        const selectedProduct = products.find(function (product) {
            return Number(product.product_id) === productId;
        });

        if (selectedProduct) {
            addToCart(selectedProduct);
            renderCart(); }
    });
});}
function applyFilters() {
    const searchBox = document.getElementById("search-box");
    const sortSelect = document.getElementById("sort-select");
    const term = searchBox.value.trim().toLowerCase();

    let filteredProducts = products.filter(function (product) {
        const matchesSearch =
            product.name.toLowerCase().includes(term);
        const categoryName =
            product.category?.category_name || "Uncategorized";
        const matchesCategory =
            selectedCategory === "All" ||
            categoryName === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    if (sortSelect.value === "low-high") {
        filteredProducts.sort(function (a, b) {
            return Number(a.price) - Number(b.price);
        });
    } else if (sortSelect.value === "high-low") {
        filteredProducts.sort(function (a, b) {
            return Number(b.price) - Number(a.price);
        });
    } else {
        filteredProducts.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });
    }
    renderProducts(filteredProducts);}
// Step 1: Calculate the matching score
function scoreProduct(product, queryWords) {
    const categoryName =
        product.category?.category_name || "";

    const text = `
        ${product.name}
        ${product.description || ""}
        ${categoryName}
    `.toLowerCase();
    let score = 0;
    queryWords.forEach(function (word) {
        if (text.includes(word)) {
            score += 1;}
    });
    return score;}

// Step 2: Extract maximum price
function extractMaxPrice(query) {
    const match = query.match(/under\s+(\d+)|below\s+(\d+)/i);
    if (!match) {
        return null; }
    return Number(match[1] || match[2]);
}
// Step 3: Search products and rank matches
function smartSearch(query, products) {
    const maxPrice = extractMaxPrice(query);
    let candidates = maxPrice !== null
        ? products.filter(function (product) {
            return Number(product.price) <= maxPrice;
        }) : products;
    const queryWords = query
        .toLowerCase()
        .split(/\s+/)
        .filter(function (word) {
            return word.length > 2 &&
                word !== "under" &&
                word !== "below" &&
                !/^\d+$/.test(word);
        });

    return candidates
        .map(function (product) {
            return {
                product: product,
                score: scoreProduct(product, queryWords)
            };
        })
        .filter(function (result) {
            return result.score > 0;
        })
        .sort(function (a, b) {
            return b.score - a.score;
        })
        .slice(0, 5)
        .map(function (result) {
            return result.product;
        });
}
function renderCategoryButtons() {
    const container = document.getElementById("category-buttons");
    const categories = [
        ...new Set(
            products.map(function (product) {
                return product.category?.category_name;
            }).filter(Boolean) )
    ];

    container.innerHTML = "";
["All", ...categories].forEach(function (category) {
        const button = document.createElement("button");

        button.type = "button";
        button.textContent = category;
        button.className = "category-btn";

        button.addEventListener("click", function () {
            selectedCategory = category;
            applyFilters();
        });

        container.appendChild(button);
    });
}

async function loadProducts() {
    const container = document.getElementById("product-list");
    const { data, error } = await window.storeSupabase
        .from("product")
     .select("product_id, name, description, price, stock, category_id, category(category_name)")
        .order("name");

    if (error) {
        container.innerHTML =
            `<p>Could not load products: ${error.message}</p>`;
        console.error(error);
        return;}

    products = data || [];
    renderCategoryButtons();
    applyFilters();}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("search-box")
        .addEventListener("input", applyFilters);

    document.getElementById("sort-select")
        .addEventListener("change", applyFilters);
// Lab 9: Smart Search Event
  const smartSearchInput =
        document.getElementById("smart-search");
    if (smartSearchInput) {
        smartSearchInput.addEventListener("input", function (event) {
            const query = event.target.value.trim();
            const resultsDiv =
                document.getElementById("smart-results");
            if (query.length < 3) {
                resultsDiv.innerHTML = "";
                return;
            }
            const matches = smartSearch(query, products);
            if (matches.length > 0) {
                resultsDiv.innerHTML = matches.map(function (product) {
                    return `
                       <p>
                            ${product.name} —
                            AED ${Number(product.price).toFixed(2)}
                        </p> `;
                }).join("");
            } else {
                resultsDiv.innerHTML =
                    "<p>No matches. Try different words.</p>";
            }
        });
    }
loadProducts();
});

function getCart() {
    return JSON.parse(localStorage.getItem("cart") || "[]");}

function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));}

function addToCart(product) {
    const cart = getCart();
    const existing = cart.find(
        item => Number(item.product_id) === Number(product.product_id) );

    if (existing) {
        existing.quantity += 1;
    } else {  cart.push({ ...product,
            quantity: 1 });
    }
    saveCart(cart);
    alert(product.name + " added to cart!");}
function removeFromCart(productId) {
    const updatedCart = getCart().filter(
        item => Number(item.product_id) !== Number(productId) );
    saveCart(updatedCart); }
function updateQuantity(productId, quantity) {
    const newQuantity = Number(quantity);

    if (!Number.isInteger(newQuantity) || newQuantity <= 0) {
        removeFromCart(productId);
        return; }

    const cart = getCart().map(item => {
        if (Number(item.product_id) === Number(productId)) {
            return {
                ...item,
                quantity: newQuantity };}
        return item;
    });
    saveCart(cart);}

function renderCart() {
    const cart = getCart();
    const container = document.getElementById("cart-items");
    const subtotalElement = document.getElementById("subtotal");

    if (!container || !subtotalElement) return;

    if (cart.length === 0) {
        container.innerHTML = "<p>Your cart is empty.</p>";
        subtotalElement.textContent = "0.00";
        return; }
let subtotal = 0;

    container.innerHTML = cart.map(item => {
        const lineTotal = Number(item.price) * Number(item.quantity);
        subtotal += lineTotal;

        return `
            <div class="cart-item">
                <h3>${item.name}</h3>
                <p>Price: AED ${Number(item.price).toFixed(2)}</p>

                <label>
                    Quantity: <input  type="number"    min="1"
                        value="${item.quantity}"
            onchange="updateQuantity(${item.product_id}, this.value); renderCart();"  >
                </label>
 <p>Line total: AED ${lineTotal.toFixed(2)}</p>

                <button
                    type="button"
                    onclick="removeFromCart(${item.product_id}); renderCart();" >
                    Remove
                </button>
            </div>
        `;
    }).join("");

    subtotalElement.textContent = subtotal.toFixed(2);
}
async function updateNavForAuth() {
    const navSlot = document.getElementById("auth-nav-slot");
    if (!navSlot || !window.storeSupabase) return;

    try {
        const { data: { user }, error } =
            await window.storeSupabase.auth.getUser();

        if (error) throw error;

        if (user) {
            navSlot.innerHTML =
                `<span>Hi, ${user.email}</span> ` +
                `<a href="#" id="logout-link">Log out</a>`;

            document.getElementById("logout-link")
                .addEventListener("click", async function (event) {
                    event.preventDefault();

                    const { error } =
                        await window.storeSupabase.auth.signOut();

                    if (error) {
                        alert(error.message);
                        return;
                    }

                    window.location.href = "index.html";
                });
        } else {
            navSlot.innerHTML = '<a href="login.html">Login</a>';
        }
    } catch (error) {
        console.error("Authentication error:", error);
    }
}

async function requireLogin() {
    const { data: { user }, error } =
        await window.storeSupabase.auth.getUser();

    if (error || !user) {
        window.location.href = "login.html";
        return null;
    }

    return user;
}

document.addEventListener("DOMContentLoaded", function () {
    updateNavForAuth();
});