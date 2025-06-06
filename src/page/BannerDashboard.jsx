import { useState, useRef, useEffect } from "react";
import axios from "axios";
import BannerTable from "@/components/BannerTable";

const BannerDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bannerImage, setBannerImage] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    link: "",
    isActive: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);

  const openModal = (banner = null) => {
    if (banner) {
      setFormData({
        title: banner.title,
        description: banner.description,
        link: banner.link,
        isActive: banner.isActive
      });
      setEditingId(banner.id);
      if (banner.imageUrl) {
        setBannerImage({
          preview: banner.imageUrl
        });
      }
    } else {
      setFormData({
        title: "",
        description: "",
        link: "",
        isActive: true
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setBannerImage(null);
    setFormData({
      title: "",
      description: "",
      link: "",
      isActive: true
    });
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerImage({
        file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  const triggerFileInput = () => fileInputRef.current.click();

  const removeImage = () => {
    if (bannerImage) {
      if (bannerImage.preview.startsWith('blob:')) {
        URL.revokeObjectURL(bannerImage.preview);
      }
      setBannerImage(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || (!bannerImage && !editingId)) {
      alert("Title and banner image are required");
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Append text fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('link', formData.link);
      formDataToSend.append('isActive', formData.isActive);
      
      // Append banner image if exists (and is a new file)
      if (bannerImage?.file) {
        formDataToSend.append('image', bannerImage.file);
      }

      let response;
      if (editingId) {
        formDataToSend.append('id', editingId);
        response = await axios.put('/api/v1/banners', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        response = await axios.post('/api/v1/banners', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      console.log('Banner saved:', response.data);
      closeModal();
      // Refresh the banner table
      window.location.reload();
    } catch (error) {
      console.error('Error saving banner:', error);
      alert(error.response?.data?.error || 'Failed to save banner');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this banner?")) {
      try {
        await axios.delete(`/api/v1/banners?id=${id}`);
        window.location.reload();
      } catch (error) {
        console.error('Error deleting banner:', error);
        alert(error.response?.data?.error || 'Failed to delete banner');
      }
    }
  };

  return (
    <div className="py-[2vw] px-[3vh]">
      <div className="flex flex-col bg-white p-[3vw] rounded-[2vw]">
        <div className="flex flex-row justify-between px-[1vw]">
          <h1 className="text-[1.5vw] text-[#00C7BE]">Banner Management</h1>
          <button
            onClick={() => openModal()}
            className="flex flex-row align-center justify-center bg-[#F5F5F6] px-[0.8vw] py-[0.2vh] rounded-[0.8vw] aspect-square hover:bg-[#00C7BE] hover:text-white transition-colors"
          >
            <h1 className="text-[1.5vw]">+</h1>
          </button>
        </div>
        <BannerTable onEdit={openModal} onDelete={handleDelete} />

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-[2vw] rounded-[1vw] w-[50vw] max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-[1.5vw]">
                <h2 className="text-[1.5vw] font-semibold">
                  {editingId ? "Edit Banner" : "Add New Banner"}
                </h2>
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
                  <div className="w-full h-[15vw] rounded-[1vw] overflow-hidden bg-gray-100 border-2 border-gray-300">
                    {bannerImage ? (
                      <img
                        src={bannerImage.preview}
                        alt="Banner preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-[3vw]">+ Banner Image</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={bannerImage ? removeImage : triggerFileInput}
                    className={`absolute top-2 right-2 rounded-full p-[0.5vw] ${
                      bannerImage ? 'bg-red-500 hover:bg-red-600' : 'bg-[#00C7BE] hover:bg-[#00a69e]'
                    } text-white`}
                  >
                    {bannerImage ? (
                      <span className="text-[1vw]">×</span>
                    ) : (
                      <span className="text-[1vw]">+</span>
                    )}
                  </button>
                </div>
                <p className="text-[0.8vw] text-gray-500 mt-[0.5vw]">
                  {bannerImage ? "Banner image selected" : "Upload banner image (Recommended: 1200x400px)"}
                </p>
              </div>

              <div className="space-y-[1vw]">
                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Title*</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                    placeholder="Enter banner title"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                    placeholder="Enter banner description"
                    rows="3"
                  />
                </div>
                
                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Link URL</label>
                  <input
                    type="url"
                    name="link"
                    value={formData.link}
                    onChange={handleInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="mr-[0.5vw]"
                  />
                  <label htmlFor="isActive" className="text-[1vw]">
                    Active (Show this banner)
                  </label>
                </div>
              </div>

              <div className="flex justify-end mt-[2vw] space-x-[1vw]">
                <button
                  onClick={closeModal}
                  className="px-[1.5vw] py-[0.5vw] bg-gray-200 rounded-[0.5vw] hover:bg-gray-300 text-[1vw]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.title || (!bannerImage && !editingId) || isLoading}
                  className={`px-[1.5vw] py-[0.5vw] rounded-[0.5vw] text-[1vw] ${
                    !formData.title || (!bannerImage && !editingId) || isLoading
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-[#00C7BE] text-white hover:bg-[#00a69e]"
                  }`}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BannerDashboard;