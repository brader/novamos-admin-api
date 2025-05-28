import Image from "next/image";
import noIcon from "@/assett/noIcon.jpg";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

const KategoriTable = () => {
  const [kategoriList, setKategoriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedKategori, setSelectedKategori] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchKategori();
  }, []);

  const fetchKategori = async () => {
    try {
      const response = await axios.get("/api/v1/kategori");
      setKategoriList(response.data);
    } catch (err) {
      console.error("Error fetching kategori:", err);
      setError("Failed to load kategori");
    } finally {
      setLoading(false);
    }
  };

  const openKategoriModal = (kategori) => {
    setSelectedKategori(kategori);
    setIsEditing(false);
    setEditData({
      name: kategori.name,
    });
  };

  const closeModal = () => {
    setSelectedKategori(null);
    setIsEditing(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({
      name: selectedKategori.name,
    });
  };

  const saveChanges = async () => {
    try {
      const formData = new FormData();
      formData.append('namaKategori', editData.name);
      
      // If there's a new image, append it
      if (fileInputRef.current?.files?.[0]) {
        formData.append('gambar', fileInputRef.current.files[0]);
      }
  
      const response = await axios.put(
        `/api/v1/kategori?id=${selectedKategori.id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
  
      setKategoriList(
        kategoriList.map((k) => (k.id === selectedKategori.id ? response.data : k))
      );
      setSelectedKategori(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating kategori:", err);
      alert("Failed to update kategori");
    }
  };

  const deleteKategori = async () => {
    if (confirm("Are you sure you want to delete this kategori?")) {
      try {
        await axios.delete(`/api/v1/kategori?id=${selectedKategori.id}`);
        setKategoriList(kategoriList.filter((k) => k.id !== selectedKategori.id));
        closeModal();
      } catch (err) {
        console.error("Error deleting kategori:", err);
        alert("Failed to delete kategori");
      }
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('gambar', file);
      formData.append('namaKategori', selectedKategori.name);

      const response = await axios.put(
        `/api/v1/kategori?id=${selectedKategori.id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setSelectedKategori(response.data);
      setKategoriList(
        kategoriList.map((k) => (k.id === selectedKategori.id ? response.data : k))
      );
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset file input
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  if (loading) {
    return <div className="text-center py-4">Sedang memuat...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  if (kategoriList.length === 0) {
    return <div className="text-center py-4">Tidak ditemukan kategori</div>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border-separate border-spacing-y-2">
          <thead className="bg-white">
            <tr>
              <th className="py-3 px-4 text-left text-black/40 font-semibold text-[1.3vw]">
                Nama
              </th>
            </tr>
          </thead>
          <tbody>
            {kategoriList.map((kategori, index) => (
              <tr
                key={kategori.id}
                className="bg-white transition-colors hover:bg-gray-50 cursor-pointer"
                onClick={() => openKategoriModal(kategori)}
              >
                <td
                  className={`py-[1vw] px-[2vh] ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"
                  } rounded-[1vw] flex flex-row items-center gap-[1vw]`}
                >
                  <div className="flex-shrink-0 w-[3vw] rounded-full">
                    <Image
                      src={kategori.image || noIcon}
                      alt={`${kategori.name} icon`}
                      width={40}
                      height={40}
                      className="rounded-[1vw] w-[5vw] aspect-square"
                      onError={(e) => {
                        e.target.src = noIcon;
                      }}
                    />
                  </div>
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[15vw] text-[1.3vw]">
                    {kategori.name || "No name"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: "none" }}
      />

      {/* Kategori Detail Modal */}
      {selectedKategori && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>

              {/* Image Display */}
              <div className="relative mb-6">
                <div className="flex overflow-hidden rounded-lg bg-gray-100">
                  {selectedKategori.image ? (
                    <Image
                      src={selectedKategori.image || noIcon}
                      alt={`${selectedKategori.name}`}
                      width={800}
                      height={600}
                      className="w-full h-64 object-contain"
                      onError={(e) => {
                        e.target.src = noIcon;
                      }}
                    />
                  ) : (
                    <div className="w-full h-64 flex items-center justify-center bg-gray-100">
                      <span className="text-gray-400">No image available</span>
                    </div>
                  )}
                </div>

                {/* Image action button */}
                {isEditing && (
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={triggerFileInput}
                      className="bg-blue-500 text-white rounded-full p-2 shadow-md hover:bg-blue-600"
                      title="Change image"
                      disabled={uploading}
                    >
                      {uploading ? (
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Kategori Details */}
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-semibold text-[1vw]">Nama Kategori</h3>
                  <h2 className="text-[1.5vw]">
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={editData.name}
                        onChange={handleEditChange}
                        className="border p-2 w-full"
                      />
                    ) : (
                      selectedKategori.name
                    )}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-[1vw] mb-2">Dibuat Pada</h3>
                    <p className="text-gray-700 text-[1.5vw]">
                      {new Date(selectedKategori.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[1vw] mb-2">Diperbarui Pada</h3>
                    <p className="text-gray-700 text-[1.5vw]">
                      {new Date(selectedKategori.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 mt-6">
                {isEditing ? (
                  <>
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      Batal
                    </button>
                    <button
                      onClick={saveChanges}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Simpan
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={deleteKategori}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Hapus
                    </button>
                    <button
                      onClick={startEditing}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KategoriTable;