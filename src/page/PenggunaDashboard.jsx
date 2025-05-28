import { useState, useRef, useEffect } from "react";
import axios from "axios";
import PenggunaTable from "@/components/PenggunaTable";

const PenggunaDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "user"
  });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setProfileImage(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "user"
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage({
        file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  const triggerFileInput = () => fileInputRef.current.click();

  const removeImage = () => {
    if (profileImage) {
      URL.revokeObjectURL(profileImage.preview);
      setProfileImage(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      alert("Nama dan email wajib diisi");
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Append text fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('role', formData.role);
      
      // Append profile image if exists
      if (profileImage) {
        formDataToSend.append('profile', profileImage.file);
      }

      const { data } = await axios.post('/api/v1/pengguna', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('User created:', data);
      closeModal();
      // Refresh the user table
      window.location.reload();
    } catch (error) {
      console.error('Error creating user:', error);
      alert(error.response?.data?.error || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-[2vw] px-[3vh]">
      <div className="flex flex-col bg-white p-[3vw] rounded-[2vw]">
        <div className="flex flex-row justify-between px-[1vw]">
          <h1 className="text-[1.5vw] text-[#00C7BE]">Pengguna</h1>
          <button
            onClick={openModal}
            className="flex flex-row align-center justify-center bg-[#F5F5F6] px-[0.8vw] py-[0.2vh] rounded-[0.8vw] aspect-square hover:bg-[#00C7BE] hover:text-white transition-colors"
          >
            <h1 className="text-[1.5vw]">+</h1>
          </button>
        </div>
        <PenggunaTable />

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-[2vw] rounded-[1vw] w-[50vw] max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-[1.5vw]">
                <h2 className="text-[1.5vw] font-semibold">Tambah Pengguna</h2>
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
                    {profileImage ? (
                      <img
                        src={profileImage.preview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-[3vw]">+</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={profileImage ? removeImage : triggerFileInput}
                    className={`absolute bottom-0 right-0 rounded-full p-[0.5vw] ${
                      profileImage ? 'bg-red-500 hover:bg-red-600' : 'bg-[#00C7BE] hover:bg-[#00a69e]'
                    } text-white`}
                  >
                    {profileImage ? (
                      <span className="text-[1vw]">×</span>
                    ) : (
                      <span className="text-[1vw]">+</span>
                    )}
                  </button>
                </div>
                <p className="text-[0.8vw] text-gray-500 mt-[0.5vw]">
                  {profileImage ? "Foto profil dipilih" : "Upload foto profil"}
                </p>
              </div>

              <div className="space-y-[1vw]">
                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Nama Lengkap</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                    placeholder="Masukkan email"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Nomor Telepon</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                    placeholder="Masukkan nomor telepon"
                  />
                </div>

                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
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
                  disabled={!formData.name || !formData.email || isLoading}
                  className={`px-[1.5vw] py-[0.5vw] rounded-[0.5vw] text-[1vw] ${
                    !formData.name || !formData.email || isLoading
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

export default PenggunaDashboard;