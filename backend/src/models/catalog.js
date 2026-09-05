import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const productsPath = path.join(__dirname, '../data/products.json');

let products = [];

try {
  const data = fs.readFileSync(productsPath, 'utf-8');
  products = JSON.parse(data);
} catch (error) {
  console.error("Failed to load products seed data:", error);
  products = [];
}

export function getAllProducts() {
  return products;
}

export function getProductById(id) {
  return products.find(p => p.id === id) || null;
}

export function searchProducts({ category, search, minPrice, maxPrice, tags, limit = 20 }) {
  let result = [...products];

  if (category && category !== 'All') {
    const normCategory = category.toLowerCase();
    result = result.filter(p => p.category.toLowerCase().includes(normCategory));
  }

  if (search) {
    const term = search.toLowerCase();
    result = result.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      p.tags.some(t => t.toLowerCase().includes(term)) ||
      p.features.some(f => f.toLowerCase().includes(term))
    );
  }

  if (minPrice !== undefined && minPrice !== null) {
    result = result.filter(p => p.price >= Number(minPrice));
  }

  if (maxPrice !== undefined && maxPrice !== null && !isNaN(maxPrice)) {
    result = result.filter(p => p.price <= Number(maxPrice));
  }

  if (tags && Array.isArray(tags) && tags.length > 0) {
    result = result.filter(p => 
      tags.some(tag => p.tags.includes(tag.toLowerCase()))
    );
  }

  return result.slice(0, limit);
}

export function getComplementaryProducts(productId) {
  const mainProduct = getProductById(productId);
  if (!mainProduct || !mainProduct.complementary_product_ids) return [];

  return mainProduct.complementary_product_ids
    .map(id => getProductById(id))
    .filter(Boolean);
}
