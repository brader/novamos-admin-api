import { db, storage } from '@/firebase/configure';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

function bufferToStream(buffer) {
  const readable = new Readable();
  readable._read = () => {}; // _read is required but noop
  readable.push(buffer);
  readable.push(null);
  return readable;
}

export async function POST(request, { params }) {
  try {
    const { id } = params;
    
    // Verify product exists
    const productRef = db.collection('produk').doc(id);
    const productDoc = await productRef.get();
    
    if (!productDoc.exists) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const imageFiles = formData.getAll('images');

    if (!imageFiles || imageFiles.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    const bucket = storage.bucket('novamosapp.firebasestorage.app');
    const currentImages = productDoc.data().images || [];
    const newImageUrls = [];

    // Upload new images
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
      newImageUrls.push(publicUrl);
    }

    // Update product with new images
    const updatedImages = [...currentImages, ...newImageUrls];
    await productRef.update({
      images: updatedImages,
      updatedAt: new Date().toISOString()
    });

    // Get updated product data
    const updatedProduct = {
      id: productDoc.id,
      ...productDoc.data(),
      images: updatedImages,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(updatedProduct);

  } catch (error) {
    console.error('Error uploading product images:', error);
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
    try {
      const { id } = params;
      const { imageUrl } = await request.json();
  
      if (!imageUrl) {
        return NextResponse.json(
          { error: 'Image URL is required' },
          { status: 400 }
        );
      }
  
      // Verify product exists
      const productRef = db.collection('produk').doc(id);
      const productDoc = await productRef.get();
      
      if (!productDoc.exists) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
  
      // Extract file path from URL and ensure it's in the products folder
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      
      // Find the index where the actual file path begins (after bucket name)
      const bucketNameIndex = pathParts.indexOf('novamosapp.firebasestorage.app');
      if (bucketNameIndex === -1) {
        return NextResponse.json(
          { error: 'Invalid image URL format' },
          { status: 400 }
        );
      }
  
      // Reconstruct path with products folder
      const filePath = `products/${decodeURIComponent(pathParts.slice(bucketNameIndex + 2).join('/'))}`;
      
      const bucket = storage.bucket('novamosapp.firebasestorage.app');
      const file = bucket.file(filePath);
  
      // Check if file exists before trying to delete
      const [exists] = await file.exists();
      if (!exists) {
        // Just remove from product's images array if file doesn't exist in storage
        const currentImages = productDoc.data().images || [];
        const updatedImages = currentImages.filter(img => img !== imageUrl);
  
        await productRef.update({
          images: updatedImages,
          updatedAt: new Date().toISOString()
        });
  
        return NextResponse.json({
          success: true,
          message: 'Image reference removed (file not found in storage)',
          images: updatedImages
        });
      }
  
      // Delete file from storage
      await file.delete();
  
      // Remove from product's images array
      const currentImages = productDoc.data().images || [];
      const updatedImages = currentImages.filter(img => img !== imageUrl);
  
      await productRef.update({
        images: updatedImages,
        updatedAt: new Date().toISOString()
      });
  
      return NextResponse.json({
        success: true,
        message: 'Image deleted successfully',
        images: updatedImages
      });
  
    } catch (error) {
      console.error('Error deleting product image:', error);
      
      if (error.code === 404) {
        return NextResponse.json(
          { error: 'File not found in storage' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to delete image' },
        { status: 500 }
      );
    }
  }