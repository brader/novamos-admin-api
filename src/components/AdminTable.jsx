import Image from "next/image";
import noIcon from "@/assett/noicon.png";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

const AdminTable = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: "",
    password: "",
    question: "",
    answer: ""
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await axios.get("/api/v1/admin");
      setAdmins(response.data || []);
    } catch (err) {
      console.error("Error fetching admins:", err);
      setError("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  const openAdminModal = (admin) => {
    setSelectedAdmin(admin);
    setIsEditing(false);
    setEditData({
      username: admin.username || "",
      password: "",
      question: admin.question || "",
      answer: admin.answer || ""
    });
  };

  const closeModal = () => {
    setSelectedAdmin(null);
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
      username: selectedAdmin.username || "",
      password: "",
      question: selectedAdmin.question || "",
      answer: selectedAdmin.answer || ""
    });
  };

  const saveChanges = async () => {
    try {
      // Only send password if it was changed
      const dataToSend = {...editData};
      if (!dataToSend.password) {
        delete dataToSend.password;
      }

      const response = await axios.put(
        `/api/v1/admin/${selectedAdmin.id}`,
        dataToSend
      );
      setAdmins(
        admins.map((a) => (a.id === selectedAdmin.id ? response.data : a))
      );
      setSelectedAdmin(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating admin:", err);
      alert("Failed to update admin");
    }
  };

  const deleteAdmin = async () => {
    if (confirm("Are you sure you want to delete this admin?")) {
      try {
        await axios.delete(`/api/v1/admin/${selectedAdmin.id}`);
        setAdmins(admins.filter((a) => a.id !== selectedAdmin.id));
        closeModal();
      } catch (err) {
        console.error("Error deleting admin:", err);
        alert("Failed to delete admin");
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
        `/api/v1/admin/${selectedAdmin.id}/image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedAdmin = uploadResponse.data;
      setSelectedAdmin(updatedAdmin);
      setAdmins(
        admins.map((a) => (a.id === selectedAdmin.id ? updatedAdmin : a))
      );
    } catch (err) {
      console.error("Error uploading admin image:", err);
      alert("Failed to upload admin image");
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset file input
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  if (admins.length === 0) {
    return <div className="text-center py-4">No admins found</div>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border-separate border-spacing-y-2">
          <thead className="bg-white">
            <tr>
              <th className="py-3 px-4 text-left text-black/40 font-semibold text-[1.3vw]">
                Username
              </th>
              <th className="py-3 px-4 text-left text-black/40 font-semibold text-[1.3vw]">
                Security Question
              </th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin, index) => (
              <tr
                key={admin.id}
                className="bg-white transition-colors hover:bg-gray-50 cursor-pointer"
                onClick={() => openAdminModal(admin)}
              >
                <td
                  className={`py-[1vw] px-[2vh] flex ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"
                  } items-center rounded-l-[1vw]`}
                >
                  <div className="flex-shrink-0 w-[3vw] rounded-full mr-3">
                    <Image
                      src={admin.image || noIcon}
                      alt={`${admin.username} profile`}
                      width={40}
                      height={40}
                      className="rounded-full w-[5vw] aspect-square"
                      onError={(e) => {
                        e.target.src = noIcon;
                      }}
                    />
                  </div>
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[15vw] text-[1.3vw]">
                    {admin.username || "No username"}
                  </span>
                </td>
                <td
                  className={`py-[1vw] px-[2vh] rounded-r-[1vw] text-[1.3vw] ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"
                  }`}
                >
                  {admin.question || "No security question"}
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

      {/* Admin Detail Modal */}
      {selectedAdmin && (
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

              {/* Admin Image */}
              <div className="relative mb-6 flex flex-col items-center">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mb-4">
                  <Image
                    src={selectedAdmin.image || noIcon}
                    alt={`${selectedAdmin.username}'s profile`}
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
                    {uploading ? "Uploading..." : "Change Profile Image"}
                  </button>
                )}
              </div>

              {/* Admin Details */}
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-semibold text-[1vw]">Username</h3>
                  {isEditing ? (
                    <input
                      type="text"
                      name="username"
                      value={editData.username}
                      onChange={handleEditChange}
                      className="border p-2 w-full text-[1.5vw]"
                    />
                  ) : (
                    <h2 className="text-[1.5vw]">{selectedAdmin.username}</h2>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-[1vw]">Password</h3>
                  <input
                    type="password"
                    name="password"
                    value={editData.password}
                    onChange={handleEditChange}
                    className="border p-2 w-full text-[1.5vw]"
                    placeholder={isEditing ? "Enter new password" : "********"}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-[1vw]">Security Question</h3>
                  {isEditing ? (
                    <input
                      type="text"
                      name="question"
                      value={editData.question}
                      onChange={handleEditChange}
                      className="border p-2 w-full text-[1.5vw]"
                    />
                  ) : (
                    <p className="text-gray-700 text-[1.5vw]">
                      {selectedAdmin.question}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-[1vw]">Security Answer</h3>
                  {isEditing ? (
                    <input
                      type="text"
                      name="answer"
                      value={editData.answer}
                      onChange={handleEditChange}
                      className="border p-2 w-full text-[1.5vw]"
                    />
                  ) : (
                    <p className="text-gray-700 text-[1.5vw]">
                      {selectedAdmin.answer ? "••••••••" : "No answer"}
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
                      Cancel
                    </button>
                    <button
                      onClick={saveChanges}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={deleteAdmin}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
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

export default AdminTable;