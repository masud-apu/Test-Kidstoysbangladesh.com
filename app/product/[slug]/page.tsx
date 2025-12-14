// app/product/[slug]/page.js (or similar)

// Use the environment variable for the API base URL
const BASE_URL = process.env.EXTERNAL_API_URL; 

export async function generateStaticParams() {
  // Fetch product slugs from your external API
  const response = await fetch(`${BASE_URL}/products/slugs`); // <--- FIX IS HERE
  const products = await response.json();

  return products.map((product) => ({
    slug: product.slug,
  }));
}