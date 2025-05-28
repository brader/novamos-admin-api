import { useState, useRef, useEffect } from "react";
import axios from "axios";
import AdminTable from "@/components/AdminTable";

const AdminDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminImage, setAdminImage] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    question: "",
    answer: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setAdminImage(null);
    setFormData({
      username: "",
      password: "",
      question: "",
      answer: ""
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAdminImage({
        file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  const triggerFileInput = () => fileInputRef.current.click();

  const removeImage = () => {
    if (adminImage) {
      URL.revokeObjectURL(adminImage.preview);
      setAdminImage(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData.username || !formData.password || !formData.question || !formData.answer) {
      alert("Username, password, security question and answer are required");
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Append text fields
      formDataToSend.append('username', formData.username);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('question', formData.question);
      formDataToSend.append('answer', formData.answer);
      
      // Append admin image if exists
      if (adminImage) {
        formDataToSend.append('image', adminImage.file);
      }

      const { data } = await axios.post('/api/v1/admin', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Admin created:', data);
      closeModal();
      // Refresh the admin table
      window.location.reload();
    } catch (error) {
      console.error('Error creating admin:', error);
      alert(error.response?.data?.error || 'Failed to create admin');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-[2vw] px-[3vh]">
      <div className="flex flex-col bg-white p-[3vw] rounded-[2vw]">
        <div className="flex flex-row justify-between px-[1vw]">
          <h1 className="text-[1.5vw] text-[#00C7BE]">Admin Accounts</h1>
          <button
            onClick={openModal}
            className="flex flex-row align-center justify-center bg-[#F5F5F6] px-[0.8vw] py-[0.2vh] rounded-[0.8vw] aspect-square hover:bg-[#00C7BE] hover:text-white transition-colors"
          >
            <h1 className="text-[1.5vw]">+</h1>
          </button>
        </div>
        <AdminTable />

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-[2vw] rounded-[1vw] w-[50vw] max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-[1.5vw]">
                <h2 className="text-[1.5vw] font-semibold">Add New Admin</h2>
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
                    {adminImage ? (
                      <img
                        src={adminImage.preview}
                        alt="Admin preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-[3vw]">+</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={adminImage ? removeImage : triggerFileInput}
                    className={`absolute bottom-0 right-0 rounded-full p-[0.5vw] ${
                      adminImage ? 'bg-red-500 hover:bg-red-600' : 'bg-[#00C7BE] hover:bg-[#00a69e]'
                    } text-white`}
                  >
                    {adminImage ? (
                      <span className="text-[1vw]">×</span>
                    ) : (
                      <span className="text-[1vw]">+</span>
                    )}
                  </button>
                </div>
                <p className="text-[0.8vw] text-gray-500 mt-[0.5vw]">
                  {adminImage ? "Profile image selected" : "Upload profile image"}
                </p>
              </div>

              <div className="space-y-[1vw]">
                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                    placeholder="Enter username"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                    placeholder="Enter password"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Security Question</label>
                  <input
                    type="text"
                    name="question"
                    value={formData.question}
                    onChange={handleInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                    placeholder="Enter security question"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Security Answer</label>
                  <input
                    type="text"
                    name="answer"
                    value={formData.answer}
                    onChange={handleInputChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                    placeholder="Enter security answer"
                    required
                  />
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
                  disabled={!formData.username || !formData.password || !formData.question || !formData.answer || isLoading}
                  className={`px-[1.5vw] py-[0.5vw] rounded-[0.5vw] text-[1vw] ${
                    !formData.username || !formData.password || !formData.question || !formData.answer || isLoading
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

export default AdminDashboard;