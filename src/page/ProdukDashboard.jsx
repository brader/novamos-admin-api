import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ProdukTable from "@/components/ProdukTable";

const ProdukDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({
    productName: "",
    description: "",
    berat: "",
    price: "",
    categoryId: "" // Add categoryId to formData
  });
  const [categories, setCategories] = useState([]); // State for categories
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false); // Loading state for categories
  const fileInputRef = useRef(null);

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const { data } = await axios.get('/api/v1/kategori');
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        alert(error.response?.data?.error || 'Failed to load categories');
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setImages([]);
    setFormData({
      productName: "",
      description: "",
      berat: "",
      price: "",
      categoryId: ""
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setImages((prev) => [...prev, ...newImages]);
    }
  };

  const triggerFileInput = () => fileInputRef.current.click();

  const removeImage = (index) => {
    URL.revokeObjectURL(images[index].preview);
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.productName || !formData.price || images.length === 0 || !formData.categoryId) {
      alert("Judul, harga, kategori, dan gambar produk wajib diisi");
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Append text fields
      formDataToSend.append('productName', formData.productName);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('berat', formData.berat);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('categoryId', formData.categoryId);
      
      // Append image files
      images.forEach((img) => {
        formDataToSend.append('images', img.file);
      });

      const { data } = await axios.post('/api/v1/produk', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Product created:', data);
      closeModal();
      // You might want to refresh the product table here
      window.location.reload(); // Simple way to refresh the table
    } catch (error) {
      console.error('Error submitting product:', error);
      alert(error.response?.data?.error || 'Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-[2vw] px-[3vh]">
      <div className="flex flex-col bg-white p-[3vw] rounded-[2vw]">
        <div className="flex flex-row justify-between px-[1vw]">
          <h1 className="text-[1.5vw] text-[#00C7BE]">Produk</h1>
          <button
            onClick={openModal}
            className="flex flex-row align-center justify-center bg-[#F5F5F6] px-[0.8vw] py-[0.2vh] rounded-[0.8vw] aspect-square hover:bg-[#00C7BE] hover:text-white transition-colors"
          >
            <h1 className="text-[1.5vw]">+</h1>
          </button>
        </div>
        <ProdukTable />

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-[2vw] rounded-[1vw] w-[50vw] max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-[1.5vw]">
                <h2 className="text-[1.5vw] font-semibold">Tambah Produk</h2>
                <button onClick={closeModal} className="text-[1.5vw] hover:text-gray-500">
                  ×
                </button>
              </div>

              <div className="mb-[1.5vw]">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                  multiple
                />

                <div className="flex items-center gap-[1vw]">
                  <button
                    onClick={triggerFileInput}
                    className="flex-shrink-0 flex items-center justify-center w-[5vw] aspect-square border-2 border-dashed border-gray-300 rounded-[1vw] hover:border-[#00C7BE] transition-colors overflow-hidden"
                  >
                    <span className="text-[1.5vw] text-gray-300 hover:text-[#00C7BE]">+</span>
                  </button>

                  {images.length > 0 && (
                    <div className="flex-1 overflow-x-auto">
                      <div className="flex gap-[0.5vw] py-[0.5vw]">
                        {images.map((image, index) => (
                          <div key={index} className="relative group flex-shrink-0">
                            <img
                              src={image.preview}
                              alt={`Preview ${index + 1}`}
                              className="w-[5vw] aspect-square object-cover rounded-[0.5vw] border border-gray-200"
                            />
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-[1.2vw] h-[1.2vw] flex items-center justify-center text-[0.8vw] hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {images.length > 0 && (
                  <p className="text-[0.8vw] text-gray-500 mt-[0.5vw]">
                    {images.length} gambar dipilih
                  </p>
                )}
              </div>

              <div className="space-y-[1vw]">
                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Judul</label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                    placeholder="Masukkan nama produk"
                    required
                  />
                </div>
                
                {/* Add Category Dropdown */}
                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Kategori</label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                    required
                    disabled={isLoadingCategories}
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.nama_kategori}
                      </option>
                    ))}
                  </select>
                  {isLoadingCategories && (
                    <p className="text-[0.8vw] text-gray-500 mt-[0.5vw]">Memuat kategori...</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Deskripsi</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw] min-h-[8vh]"
                    placeholder="Masukkan deskripsi produk"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Berat (gram)</label>
                  <input
                    type="number"
                    name="berat"
                    value={formData.berat}
                    onChange={handleInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                    placeholder="Masukkan berat (gram)"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Harga</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                    placeholder="Masukkan harga"
                    min="0"
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
                  disabled={!formData.productName || !formData.price || !formData.categoryId || images.length === 0 || isLoading}
                  className={`px-[1.5vw] py-[0.5vw] rounded-[0.5vw] text-[1vw] ${
                    !formData.productName || !formData.price || !formData.categoryId || images.length === 0 || isLoading
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

export default ProdukDashboard;