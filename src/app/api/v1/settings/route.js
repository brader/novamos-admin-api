import { db } from '@/firebase/configure';
import { NextResponse } from 'next/server';

const SETTINGS_DOC_ID = 'appSettings'; // Use a fixed document ID for settings

export async function GET() {
  try {
    const settingsRef = db.collection('settings').doc(SETTINGS_DOC_ID);
    const settingsDoc = await settingsRef.get();

    if (!settingsDoc.exists) {
      // Initialize with default settings if document doesn't exist
      const defaultSettings = {
        warehousePostalCode: '',
        availableExpeditions: {
          JNE: true,
          JNT: true,
          SiCepat: true,
          Antaraja: true,
          Tiki: true,
          Wahana: true,
          Ninja: true
        },
        createdAt: new Date().toISOString()
      };

      await settingsRef.set(defaultSettings);
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settingsDoc.data());
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const settingsRef = db.collection('settings').doc(SETTINGS_DOC_ID);

    // Validate postal code (5 digits)
    if (data.warehousePostalCode && !/^\d{5}$/.test(data.warehousePostalCode)) {
      return NextResponse.json(
        { error: 'Kode pos harus terdiri dari 5 angka' },
        { status: 400 }
      );
    }

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    await settingsRef.set(updateData, { merge: true });

    // Get the updated settings to return
    const updatedDoc = await settingsRef.get();
    return NextResponse.json(updatedDoc.data());
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}