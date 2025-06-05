import { db } from "@/firebase/configure";
import { collection, query, where, getDocs } from "firebase/firestore";

export default async function handler(req, res) {
  const { kategori } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!kategori) {
    return res.status(400).json({ message: 'Category name is required' });
  }

  try {
    // Query products where category matches (case insensitive)
    const productsRef = collection(db, 'produk');
    const q = query(
      productsRef, 
      where('kategori', '>=', kategori.toLowerCase()),
      where('kategori', '<=', kategori.toLowerCase() + '\uf8ff')
    );

    const querySnapshot = await getDocs(q);
    const products = [];
    
    querySnapshot.forEach((doc) => {
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