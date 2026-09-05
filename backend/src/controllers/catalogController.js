import { getAllProducts, getProductById, searchProducts } from '../models/catalog.js';

export function getCatalog(req, res) {
  try {
    const { category, search, minPrice, maxPrice } = req.query;
    if (category || search || minPrice || maxPrice) {
      const results = searchProducts({ category, search, minPrice, maxPrice });
      return res.json({ success: true, count: results.length, products: results });
    }
    const products = getAllProducts();
    return res.json({ success: true, count: products.length, products });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export function getProductDetails(req, res) {
  try {
    const { id } = req.params;
    const product = getProductById(id);
    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }
    return res.json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
