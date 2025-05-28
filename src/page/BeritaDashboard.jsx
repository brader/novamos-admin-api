import { useState, useRef, useEffect } from "react";
import axios from "axios";
import BeritaTable from "@/components/BeritaTable";

const BeritaDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [articleImage, setArticleImage] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    category: "",
    date: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setArticleImage(null);
    setFormData({
      title: "",
      body: "",
      category: "",
      date: ""
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setArticleImage({
        file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  const triggerFileInput = () => fileInputRef.current.click();

  const removeImage = () => {
    if (articleImage) {
      URL.revokeObjectURL(articleImage.preview);
      setArticleImage(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.body || !formData.date) {
      alert("Judul, isi, dan tanggal berita wajib diisi");
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Append text fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('body', formData.body);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('date', formData.date);
      
      // Append article image if exists
      if (articleImage) {
        formDataToSend.append('image', articleImage.file);
      }

      const { data } = await axios.post('/api/v1/berita', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Berita created:', data);
      closeModal();
      // Refresh the article table
      window.location.reload();
    } catch (error) {
      console.error('Error creating berita:', error);
      alert(error.response?.data?.error || 'Failed to create berita');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-[2vw] px-[3vh]">
      <div className="flex flex-col bg-white p-[3vw] rounded-[2vw]">
        <div className="flex flex-row justify-between px-[1vw]">
          <h1 className="text-[1.5vw] text-[#00C7BE]">Berita</h1>
          <button
            onClick={openModal}
            className="flex flex-row align-center justify-center bg-[#F5F5F6] px-[0.8vw] py-[0.2vh] rounded-[0.8vw] aspect-square hover:bg-[#00C7BE] hover:text-white transition-colors"
          >
            <h1 className="text-[1.5vw]">+</h1>
          </button>
        </div>
        <BeritaTable />

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-[2vw] rounded-[1vw] w-[50vw] max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-[1.5vw]">
                <h2 className="text-[1.5vw] font-semibold">Tambah Berita</h2>
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

                <div className="relative group w-full">
                  <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-300">
                    {articleImage ? (
                      <img
                        src={articleImage.preview}
                        alt="Berita preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-[3vw]">+</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={articleImage ? removeImage : triggerFileInput}
                    className={`absolute bottom-2 right-2 rounded-full p-[0.5vw] ${
                      articleImage ? 'bg-red-500 hover:bg-red-600' : 'bg-[#00C7BE] hover:bg-[#00a69e]'
                    } text-white`}
                  >
                    {articleImage ? (
                      <span className="text-[1vw]">×</span>
                    ) : (
                      <span className="text-[1vw]">+</span>
                    )}
                  </button>
                </div>
                <p className="text-[0.8vw] text-gray-500 mt-[0.5vw]">
                  {articleImage ? "Gambar berita dipilih" : "Upload gambar berita"}
                </p>
              </div>

              <div className="space-y-[1vw]">
                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Judul Berita</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                    placeholder="Masukkan judul berita"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Kategori</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                    placeholder="Masukkan kategori berita"
                  />
                </div>
                
                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Isi Berita</label>
                  <textarea
                    name="body"
                    value={formData.body}
                    onChange={handleInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                    placeholder="Masukkan isi berita"
                    rows="6"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Tanggal</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
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
                  disabled={!formData.title || !formData.body || !formData.date || isLoading}
                  className={`px-[1.5vw] py-[0.5vw] rounded-[0.5vw] text-[1vw] ${
                    !formData.title || !formData.body || !formData.date || isLoading
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

export default BeritaDashboard;