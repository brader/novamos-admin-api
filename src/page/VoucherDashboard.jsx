import { useState, useRef, useEffect } from "react";
import axios from "axios";
import VoucherTable from "@/components/VoucherTable";

const VoucherDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [voucherImage, setVoucherImage] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "ongkir",
    value: 0,
    min: 0,
    expired: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setVoucherImage(null);
    setFormData({
      name: "",
      description: "",
      type: "ongkir",
      value: 0,
      min: 0,
      expired: ""
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVoucherImage({
        file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  const triggerFileInput = () => fileInputRef.current.click();

  const removeImage = () => {
    if (voucherImage) {
      URL.revokeObjectURL(voucherImage.preview);
      setVoucherImage(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.description) {
      alert("Nama dan deskripsi voucher wajib diisi");
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Append text fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('value', formData.value);
      formDataToSend.append('min', formData.min);
      formDataToSend.append('expired', formData.expired);
      
      // Append voucher image if exists
      if (voucherImage) {
        formDataToSend.append('image', voucherImage.file);
      }

      const { data } = await axios.post('/api/v1/voucher', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Voucher created:', data);
      closeModal();
      // Refresh the voucher table
      window.location.reload();
    } catch (error) {
      console.error('Error creating voucher:', error);
      alert(error.response?.data?.error || 'Failed to create voucher');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-[2vw] px-[3vh]">
      <div className="flex flex-col bg-white p-[3vw] rounded-[2vw]">
        <div className="flex flex-row justify-between px-[1vw]">
          <h1 className="text-[1.5vw] text-[#00C7BE]">Voucher</h1>
          <button
            onClick={openModal}
            className="flex flex-row align-center justify-center bg-[#F5F5F6] px-[0.8vw] py-[0.2vh] rounded-[0.8vw] aspect-square hover:bg-[#00C7BE] hover:text-white transition-colors"
          >
            <h1 className="text-[1.5vw]">+</h1>
          </button>
        </div>
        <VoucherTable />

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-[2vw] rounded-[1vw] w-[50vw] max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-[1.5vw]">
                <h2 className="text-[1.5vw] font-semibold">Tambah Voucher</h2>
                <button onClick={closeModal} className="text-[1.5vw] hover:text-gray-500">
                  ×
                </button>
              </div>

              <div className="mb-[1.5vw] flex flex-col items-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                />

                <div className="relative group">
                  <div className="w-[10vw] h-[10vw] rounded-full overflow-hidden bg-gray-100 border-2 border-gray-300">
                    {voucherImage ? (
                      <img
                        src={voucherImage.preview}
                        alt="Voucher preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-[3vw]">+</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={voucherImage ? removeImage : triggerFileInput}
                    className={`absolute bottom-0 right-0 rounded-full p-[0.5vw] ${
                      voucherImage ? 'bg-red-500 hover:bg-red-600' : 'bg-[#00C7BE] hover:bg-[#00a69e]'
                    } text-white`}
                  >
                    {voucherImage ? (
                      <span className="text-[1vw]">×</span>
                    ) : (
                      <span className="text-[1vw]">+</span>
                    )}
                  </button>
                </div>
                <p className="text-[0.8vw] text-gray-500 mt-[0.5vw]">
                  {voucherImage ? "Gambar voucher dipilih" : "Upload gambar voucher"}
                </p>
              </div>

              <div className="space-y-[1vw]">
                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Nama Voucher</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                    placeholder="Masukkan nama voucher"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Deskripsi</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                    placeholder="Masukkan deskripsi voucher"
                    rows="3"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Jenis Voucher</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                  >
                    <option value="ongkir">Free Ongkir</option>
                    <option value="diskon">Diskon</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">
                    {formData.type === "ongkir" ? "Nilai Ongkir" : "Persentase Diskon"}
                  </label>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleNumberInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                    placeholder={formData.type === "ongkir" ? "Masukkan nilai ongkir" : "Masukkan persentase diskon"}
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Minimal Belanja</label>
                  <input
                    type="number"
                    name="min"
                    value={formData.min}
                    onChange={handleNumberInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                    placeholder="Masukkan minimal belanja"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Tanggal Kadaluarsa</label>
                  <input
                    type="date"
                    name="expired"
                    value={formData.expired}
                    onChange={handleInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end mt-[2vw] space-x-[1vw]">
                <button
                  onClick={closeModal}
                  className="px-[1.5vw] py-[0.5vw] bg-gray-200 rounded-[0.5vw] hover:bg-gray-300 text-[1vw]"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.name || !formData.description || !formData.expired || isLoading}
                  className={`px-[1.5vw] py-[0.5vw] rounded-[0.5vw] text-[1vw] ${
                    !formData.name || !formData.description || !formData.expired || isLoading
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-[#00C7BE] text-white hover:bg-[#00a69e]"
                  }`}
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoucherDashboard;