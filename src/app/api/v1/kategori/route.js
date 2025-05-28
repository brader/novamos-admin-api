import { db, storage } from "@/firebase/configure";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { Readable } from "stream";

// Helper: Convert ArrayBuffer to stream
function bufferToStream(buffer) {
  const readable = new Readable();
  readable._read = () => {};
  readable.push(buffer);
  readable.push(null);
  return readable;
}

export async function POST(request) {
  try {
    const formData = await request.formData();

    const namaKategori = formData.get("namaKategori");
    const gambarFile = formData.get("gambar");

    if (!namaKategori || !gambarFile || typeof gambarFile === "string") {
      return NextResponse.json(
        { error: "Nama kategori dan gambar wajib diisi" },
        { status: 400 }
      );
    }

    const bucket = storage.bucket("novamosapp.firebasestorage.app");

    const fileExtension = gambarFile.name.split(".").pop();
    const fileName = `kategori/${uuidv4()}.${fileExtension}`;
    const fileBuffer = await gambarFile.arrayBuffer();
    const fileRef = bucket.file(fileName);

    const stream = fileRef.createWriteStream({
      metadata: {
        contentType: gambarFile.type,
      },
      resumable: false,
    });

    await new Promise((resolve, reject) => {
      bufferToStream(Buffer.from(fileBuffer))
        .pipe(stream)
        .on("error", reject)
        .on("finish", resolve);
    });

    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    const kategoriRef = await db.collection("kategori").add({
      name: namaKategori,
      image: publicUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      id: kategoriRef.id,
      nama_kategori: namaKategori,
      gambar: publicUrl,
      message: "Kategori berhasil dibuat",
    });
  } catch (error) {
    console.error("Gagal menambahkan kategori:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const snapshot = await db.collection("kategori").get();

    const kategoriList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(kategoriList);
  } catch (error) {
    console.error("Gagal mengambil kategori:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID kategori wajib diisi" },
        { status: 400 }
      );
    }

    // Get the kategori document first to access the image URL
    const kategoriDoc = await db.collection("kategori").doc(id).get();

    if (!kategoriDoc.exists) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan" },
        { status: 404 }
      );
    }

    const kategoriData = kategoriDoc.data();

    // Delete the image from storage if it exists
    if (kategoriData.image) {
      try {
        const bucket = storage.bucket("novamosapp.firebasestorage.app");
        const imageUrl = new URL(kategoriData.image);
        // Extract the file path from the URL
        const filePath = decodeURIComponent(imageUrl.pathname.substring(1)); // Remove leading slash
        const file = bucket.file(filePath);

        await file.delete();
      } catch (error) {
        console.error("Gagal menghapus gambar kategori:", error);
        // Continue with deletion even if image deletion fails
      }
    }

    // Delete the document from Firestore
    await db.collection("kategori").doc(id).delete();

    return NextResponse.json({
      id: id,
      message: "Kategori berhasil dihapus",
    });
  } catch (error) {
    console.error("Gagal menghapus kategori:", error);
    return NextResponse.json(
      { error: "Gagal menghapus kategori" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const formData = await request.formData();

    const namaKategori = formData.get("namaKategori");
    const gambarFile = formData.get("gambar");
    

    if (!id) {
      return NextResponse.json(
        { error: "ID kategori wajib diisi" },
        { status: 400 }
      );
    }

    // Check if kategori exists
    const kategoriDoc = await db.collection("kategori").doc(id).get();
    if (!kategoriDoc.exists) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan" },
        { status: 404 }
      );
    }

    const existingImageUrl = kategoriDoc.data()?.image; // Get existing image from Firestore
    let imageUrl = existingImageUrl;
    const bucket = storage.bucket("novamosapp.firebasestorage.app");

    // Handle image upload if new image is provided
    if (gambarFile && typeof gambarFile !== "string") {
      // Delete old image if exists
      if (existingImageUrl) {
        try {
          const oldImageUrl = new URL(existingImageUrl);
          const oldFilePath = decodeURIComponent(
            oldImageUrl.pathname.substring(1)
          );
          const oldFile = bucket.file(oldFilePath);
          await oldFile.delete();
        } catch (error) {
          console.error("Gagal menghapus gambar lama:", error);
        }
      }

      // Upload new image
      const fileExtension = gambarFile.name.split(".").pop();
      const fileName = `kategori/${uuidv4()}.${fileExtension}`;
      const fileBuffer = await gambarFile.arrayBuffer();
      const fileRef = bucket.file(fileName);

      const stream = fileRef.createWriteStream({
        metadata: {
          contentType: gambarFile.type,
        },
        resumable: false,
      });

      await new Promise((resolve, reject) => {
        bufferToStream(Buffer.from(fileBuffer))
          .pipe(stream)
          .on("error", reject)
          .on("finish", resolve);
      });

      await fileRef.makePublic();
      imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    }

    // Prepare update data
    const updateData = {
      name: namaKategori || kategoriDoc.data().name,
      updatedAt: new Date().toISOString(),
    };

    // Only update image if a new one was uploaded
    if (imageUrl && imageUrl !== existingImageUrl) {
      updateData.image = imageUrl;
    }

    // Update the document
    await db.collection("kategori").doc(id).update(updateData);

    // Get the updated document
    const updatedDoc = await db.collection("kategori").doc(id).get();

    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedDoc.data(),
      message: "Kategori berhasil diperbarui",
    });
  } catch (error) {
    console.error("Gagal memperbarui kategori:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui kategori" },
      { status: 500 }
    );
  }
}
