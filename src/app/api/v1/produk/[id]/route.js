import { db } from '@/firebase/configure';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const productData = await request.json();
    
    const productRef = db.collection('produk').doc(id);
    await productRef.update({
      ...productData,
      updatedAt: new Date().toISOString()
    });
    
    const updatedProduct = await productRef.get();
    
    return NextResponse.json({
      id: updatedProduct.id,
      ...updatedProduct.data()
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    await db.collection('produk').doc(id).delete();
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const doc = await db.collection('produk').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: doc.id,
      ...doc.data()
    });
    
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}