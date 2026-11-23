const SUPABASE_URL = "https://eubunbimbxjwiesxcrvd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Ur6ehj1hRCk9QBBzYlqklg_TdmTtgbD";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

async function loadProduct() {
  const detail = document.getElementById("detail");
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId || !/^\d+$/.test(productId)) {
    detail.innerHTML = "<p>Invalid product ID.</p>";
    return;
  }

  const { data: product, error } = await supabase
    .from("product")
    .select("product_id, name, description, price, stock, category(category_name)")
    .eq("product_id", productId)
    .maybeSingle();

  if (error) {
    detail.innerHTML = "<p>Could not load product details.</p>";
    console.error(error);
    return;
  }

  if (!product) {
    detail.innerHTML = "<p>Product not found.</p>";
    return;
  }

  const categoryName =
    product.category?.category_name || "Uncategorized";

  detail.innerHTML = `
    <h3>${product.name}</h3>
    <p>${product.description || "No description available."}</p>
    <p>Price: AED ${Number(product.price).toFixed(2)}</p>
    <p>Category: ${categoryName}</p>
    <p>Stock: ${product.stock}</p>
    <a href="products.html">Back to Products</a>
  `;
}

document.addEventListener("DOMContentLoaded", loadProduct);