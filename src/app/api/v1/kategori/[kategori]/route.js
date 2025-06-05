import { db } from "@/firebase/configure";
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { kategori } = params;
    const decodedCategory = decodeURIComponent(kategori);

    const productsRef = db.collection('produk');
    const snapshot = await productsRef
      .where('categoryName', '==', decodedCategory)
      .get();

    const products = [];
    snapshot.forEach(doc => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: Explicitly define supported methods
export const dynamic = 'force-dynamic'; // For dynamic routes