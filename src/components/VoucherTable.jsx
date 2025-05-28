import Image from "next/image";
import noIcon from "../../public/noIcon.jpg";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

const VoucherTable = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    description: "",
    type: "ongkir",
    value: 0,
    min: 0,
    expired: "",
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const response = await axios.get("/api/v1/voucher");
      setVouchers(response.data || []);
    } catch (err) {
      console.error("Error fetching vouchers:", err);
      setError("Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  };

  const openVoucherModal = (voucher) => {
    setSelectedVoucher(voucher);
    setIsEditing(false);
    setEditData({
      name: voucher.name || "",
      description: voucher.description || "",
      type: voucher.type || "ongkir",
      value: voucher.value || 0,
      min: voucher.min || 0,
      expired: voucher.expired ? voucher.expired.split('T')[0] : "",
    });
  };

  const closeModal = () => {
    setSelectedVoucher(null);
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
      name: selectedVoucher.name || "",
      description: selectedVoucher.description || "",
      type: selectedVoucher.type || "ongkir",
      value: selectedVoucher.value || 0,
      min: selectedVoucher.min || 0,
      expired: selectedVoucher.expired ? selectedVoucher.expired.split('T')[0] : "",
    });
  };

  const saveChanges = async () => {
    try {
      const response = await axios.put(
        `/api/v1/voucher/${selectedVoucher.id}`,
        editData
      );
      setVouchers(
        vouchers.map((v) => (v.id === selectedVoucher.id ? response.data : v))
      );
      setSelectedVoucher(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating voucher:", err);
      alert("Failed to update voucher");
    }
  };

  const deleteVoucher = async () => {
    if (confirm("Are you sure you want to delete this voucher?")) {
      try {
        await axios.delete(`/api/v1/voucher/${selectedVoucher.id}`);
        setVouchers(vouchers.filter((v) => v.id !== selectedVoucher.id));
        closeModal();
      } catch (err) {
        console.error("Error deleting voucher:", err);
        alert("Failed to delete voucher");
      }
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const uploadResponse = await axios.put(
        `/api/v1/voucher/${selectedVoucher.id}/image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedVoucher = uploadResponse.data;
      setSelectedVoucher(updatedVoucher);
      setVouchers(
        vouchers.map((v) => (v.id === selectedVoucher.id ? updatedVoucher : v))
      );
    } catch (err) {
      console.error("Error uploading voucher image:", err);
      alert("Failed to upload voucher image");
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

  if (vouchers.length === 0) {
    return <div className="text-center py-4">Tidak ditemukan voucher</div>;
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
              <th className="py-3 px-4 text-left text-black/40 font-semibold text-[1.3vw]">
                Deskripsi
              </th>
              <th className="py-3 px-4 text-left text-black/40 font-semibold text-[1.3vw]">
                Jenis
              </th>
              <th className="py-3 px-4 text-left text-black/40 font-semibold text-[1.3vw]">
                Nilai
              </th>
              <th className="py-3 px-4 text-left text-black/40 font-semibold text-[1.3vw]">
                Minimal Belanja
              </th>
              <th className="py-3 px-4 text-left text-black/40 font-semibold text-[1.3vw]">
                Expired
              </th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((voucher, index) => (
              <tr
                key={voucher.id}
                className="bg-white transition-colors hover:bg-gray-50 cursor-pointer"
                onClick={() => openVoucherModal(voucher)}
              >
                <td
                  className={`py-[1vw] px-[2vh] flex ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"
                  } items-center rounded-l-[1vw]`}
                >
                  <div className="flex-shrink-0 w-[3vw] rounded-full mr-3">
                    <Image
                      src={voucher.image || noIcon}
                      alt={`${voucher.name} image`}
                      width={40}
                      height={40}
                      className="rounded-full w-[5vw] aspect-square"
                      onError={(e) => {
                        e.target.src = noIcon;
                      }}
                    />
                  </div>
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[15vw] text-[1.3vw]">
                    {voucher.name || "No name"}
                  </span>
                </td>
                <td
                  className={`py-[1vw] px-[2vh] ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"
                  } whitespace-nowrap overflow-hidden text-ellipsis max-w-[20vw] text-[1.3vw]`}
                >
                  {voucher.description || "No description"}
                </td>
                <td
                  className={`py-[1vw] px-[2vh] ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"
                  } whitespace-nowrap overflow-hidden text-ellipsis max-w-[10vw] text-[1.3vw]`}
                >
                  {voucher.type || "No type"}
                </td>
                <td
                  className={`py-[1vw] px-[2vh] ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"
                  } whitespace-nowrap overflow-hidden text-ellipsis max-w-[10vw] text-[1.3vw]`}
                >
                  {voucher.value || 0}
                </td>
                <td
                  className={`py-[1vw] px-[2vh] ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"
                  } whitespace-nowrap overflow-hidden text-ellipsis max-w-[10vw] text-[1.3vw]`}
                >
                  {voucher.min || 0}
                </td>
                <td
                  className={`py-[1vw] px-[2vh] rounded-r-[1vw] text-[1.3vw] ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"
                  }`}
                >
                  {voucher.expired ? new Date(voucher.expired).toLocaleDateString() : "No expiry"}
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

      {/* Voucher Detail Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>

              {/* Voucher Image */}
              <div className="relative mb-6 flex flex-col items-center">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mb-4">
                  <Image
                    src={selectedVoucher.image || noIcon}
                    alt={`${selectedVoucher.name}'s image`}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = noIcon;
                    }}
                  />
                </div>
                
                {isEditing && (
                  <button
                    onClick={triggerFileInput}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Change Voucher Image"}
                  </button>
                )}
              </div>

              {/* Voucher Details */}
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-semibold text-[1vw]">Nama</h3>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={editData.name}
                      onChange={handleEditChange}
                      className="border p-2 w-full text-[1.5vw]"
                    />
                  ) : (
                    <h2 className="text-[1.5vw]">{selectedVoucher.name}</h2>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-[1vw]">Deskripsi</h3>
                  {isEditing ? (
                    <textarea
                      name="description"
                      value={editData.description}
                      onChange={handleEditChange}
                      className="border p-2 w-full text-[1.5vw]"
                      rows="3"
                    />
                  ) : (
                    <p className="text-gray-700 text-[1.5vw]">
                      {selectedVoucher.description}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-[1vw]">Jenis</h3>
                  {isEditing ? (
                    <select
                      name="type"
                      value={editData.type}
                      onChange={handleEditChange}
                      className="border p-2 w-full text-[1.5vw]"
                    >
                      <option value="ongkir">Ongkos Kirim</option>
                      <option value="diskon">Diskon</option>
                    </select>
                  ) : (
                    <span className="text-gray-700 text-[1.5vw]">
                      {selectedVoucher.type === "ongkir" ? "Ongkos Kirim" : "Diskon"}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-[1vw]">Nilai</h3>
                  {isEditing ? (
                    <input
                      type="number"
                      name="value"
                      value={editData.value}
                      onChange={handleEditChange}
                      className="border p-2 w-full text-[1.5vw]"
                    />
                  ) : (
                    <p className="text-gray-700 text-[1.5vw]">
                      {selectedVoucher.value}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-[1vw]">Minimal Belanja</h3>
                  {isEditing ? (
                    <input
                      type="number"
                      name="min"
                      value={editData.min}
                      onChange={handleEditChange}
                      className="border p-2 w-full text-[1.5vw]"
                    />
                  ) : (
                    <p className="text-gray-700 text-[1.5vw]">
                      {selectedVoucher.min}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-[1vw]">Expired</h3>
                  {isEditing ? (
                    <input
                      type="date"
                      name="expired"
                      value={editData.expired}
                      onChange={handleEditChange}
                      className="border p-2 w-full text-[1.5vw]"
                    />
                  ) : (
                    <p className="text-gray-700 text-[1.5vw]">
                      {selectedVoucher.expired ? new Date(selectedVoucher.expired).toLocaleDateString() : "Tidak ada tanggal kadaluarsa"}
                    </p>
                  )}
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
                      onClick={deleteVoucher}
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

export default VoucherTable;