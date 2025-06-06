import { db, storage } from '@/firebase/configure';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const bannersRef = db.collection('banners');
    const snapshot = await bannersRef.get();
    const banners = [];
    
    snapshot.forEach(doc => {
      banners.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json(banners);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    // Get form fields
    const title = formData.get('title');
    const description = formData.get('description');
    const link = formData.get('link');
    const isActive = formData.get('isActive') === 'true';
    const imageFile = formData.get('image');

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!imageFile) {
      return NextResponse.json(
        { error: 'Banner image is required' },
        { status: 400 }
      );
    }

    // Upload image to Firebase Storage
    const storageRef = storage.ref();
    const imageRef = storageRef.child(`banners/${Date.now()}_${imageFile.name}`);
    await imageRef.put(imageFile);
    const imageUrl = await imageRef.getDownloadURL();

    // Save to Firestore
    const bannerData = {
      title,
      description: description || '',
      link: link || '',
      isActive,
      imageUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection('banners').add(bannerData);

    return NextResponse.json({
      id: docRef.id,
      ...bannerData
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json(
      { error: 'Failed to create banner' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const formData = await request.formData();
    
    const id = formData.get('id');
    const title = formData.get('title');
    const description = formData.get('description');
    const link = formData.get('link');
    const isActive = formData.get('isActive') === 'true';
    const imageFile = formData.get('image');

    if (!id || !title) {
      return NextResponse.json(
        { error: 'ID and title are required' },
        { status: 400 }
      );
    }

    const bannerRef = db.collection('banners').doc(id);
    const bannerDoc = await bannerRef.get();

    if (!bannerDoc.exists) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      );
    }

    let imageUrl = bannerDoc.data().imageUrl;

    // If new image is uploaded
    if (imageFile) {
      // Delete old image if exists
      if (imageUrl) {
        try {
          const oldImageRef = storage.refFromURL(imageUrl);
          await oldImageRef.delete();
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }

      // Upload new image
      const storageRef = storage.ref();
      const newImageRef = storageRef.child(`banners/${Date.now()}_${imageFile.name}`);
      await newImageRef.put(imageFile);
      imageUrl = await newImageRef.getDownloadURL();
    }

    // Update banner data
    const updatedData = {
      title,
      description: description || '',
      link: link || '',
      isActive,
      imageUrl,
      updatedAt: new Date().toISOString()
    };

    await bannerRef.update(updatedData);

    return NextResponse.json({
      id,
      ...updatedData
    });

  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json(
      { error: 'Failed to update banner' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Banner ID is required' },
        { status: 400 }
      );
    }

    const bannerRef = db.collection('banners').doc(id);
    const bannerDoc = await bannerRef.get();

    if (!bannerDoc.exists) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      );
    }

    // Delete image from storage
    const bannerData = bannerDoc.data();
    if (bannerData.imageUrl) {
      try {
        const imageRef = storage.refFromURL(bannerData.imageUrl);
        await imageRef.delete();
      } catch (error) {
        console.error('Error deleting banner image:', error);
      }
    }

    // Delete document from Firestore
    await bannerRef.delete();

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json(
      { error: 'Failed to delete banner' },
      { status: 500 }
    );
  }
}