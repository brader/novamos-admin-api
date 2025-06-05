// pages/api/kategori/[kategori].js
import { db } from "@/firebase/configure"; // Assuming this exports the firebase-admin db

export default async function handler(req, res) {
  const { kategori } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!kategori) {
    return res.status(400).json({ message: 'Category name is required' });
  }

  try {
    // Get reference to the 'produk' collection
    const productsRef = db.collection('produk');
    
    // Query for products in the specified category (case sensitive)
    const snapshot = await productsRef
      .where('kategori', '==', kategori)
      .get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const products = [];
    snapshot.forEach(doc => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}