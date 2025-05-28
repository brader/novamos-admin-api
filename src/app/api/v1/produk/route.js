// app/api/produk/route.js (or .ts)
import { db, storage } from '@/firebase/configure';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

// Helper: convert arrayBuffer to stream
function bufferToStream(buffer) {
  const readable = new Readable();
  readable._read = () => {}; // _read is required but noop
  readable.push(buffer);
  readable.push(null);
  return readable;
}

export async function POST(request) {
  try {
    const formData = await request.formData();

    const productName = formData.get('productName');
    const description = formData.get('description');
    const berat = formData.get('berat');
    const price = formData.get('price');
    const categoryId = formData.get('categoryId'); // Get categoryId from form data
    const imageFiles = formData.getAll('images');

    if (!productName || !price || !categoryId || !imageFiles || imageFiles.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const bucket = storage.bucket('novamosapp.firebasestorage.app');

    const imageUrls = [];

    for (const file of imageFiles) {
      if (!file || typeof file === 'string') continue;

      const fileExtension = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const fileBuffer = await file.arrayBuffer();

      const fileRef = bucket.file(`products/${fileName}`);
      const stream = fileRef.createWriteStream({
        metadata: {
          contentType: file.type,
        },
        resumable: false,
      });

      await new Promise((resolve, reject) => {
        bufferToStream(Buffer.from(fileBuffer))
          .pipe(stream)
          .on('error', reject)
          .on('finish', resolve);
      });

      // Make file public and get URL
      await fileRef.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/products/${fileName}`;
      imageUrls.push(publicUrl);
    }

    // Get category data from Firestore
    const categoryDoc = await db.collection('kategori').doc(categoryId).get();
    const categoryData = categoryDoc.data();

    const productRef = await db.collection('produk').add({
      name: productName,
      description: description || '',
      berat: Number(berat) || 0,
      price: Number(price),
      categoryId: categoryId,
      categoryName: categoryData?.name || '', // Optionally store category name for easier display
      images: imageUrls,
      status: 'Ditunda',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      id: productRef.id,
      message: 'Product created successfully',
      images: imageUrls,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const snapshot = await db.collection('produk').get();

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}