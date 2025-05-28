import Image from "next/image";
import noIcon from "../../public/noIcon.jpg";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

const PenggunaTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/v1/pengguna");
      setUsers(response.data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const openUserModal = (user) => {
    setSelectedUser(user);
    setIsEditing(false);
    setEditData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "user",
    });
  };

  const closeModal = () => {
    setSelectedUser(null);
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
      name: selectedUser.name || "",
      email: selectedUser.email || "",
      phone: selectedUser.phone || "",
      role: selectedUser.role || "user",
    });
  };

  const saveChanges = async () => {
    try {
      const response = await axios.put(
        `/api/v1/pengguna/${selectedUser.id}`,
        editData
      );
      setUsers(
        users.map((u) => (u.id === selectedUser.id ? response.data : u))
      );
      setSelectedUser(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating user:", err);
      alert("Failed to update user");
    }
  };

  const deleteUser = async () => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`/api/v1/pengguna/${selectedUser.id}`);
        setUsers(users.filter((u) => u.id !== selectedUser.id));
        closeModal();
      } catch (err) {
        console.error("Error deleting user:", err);
        alert("Failed to delete user");
      }
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("profile", file);

      const uploadResponse = await axios.put(
        `/api/v1/pengguna/${selectedUser.id}/profile`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedUser = uploadResponse.data;
      setSelectedUser(updatedUser);
      setUsers(
        users.map((u) => (u.id === selectedUser.id ? updatedUser : u))
      );
    } catch (err) {
      console.error("Error uploading profile image:", err);
      alert("Failed to upload profile image");
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

  if (users.length === 0) {
    return <div className="text-center py-4">Tidak ditemukan pengguna</div>;
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
                Email
              </th>
              <th className="py-3 px-4 text-left text-black/40 font-semibold text-[1.3vw]">
                Telepon
              </th>
              <th className="py-3 px-4 text-left text-black/40 font-semibold text-[1.3vw]">
                Role
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr
                key={user.id}
                className="bg-white transition-colors hover:bg-gray-50 cursor-pointer"
                onClick={() => openUserModal(user)}
              >
                <td
                  className={`py-[1vw] px-[2vh] flex ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"
                  } items-center rounded-l-[1vw]`}
                >
                  <div className="flex-shrink-0 w-[3vw] rounded-full mr-3">
                    <Image
                      src={user.profile || noIcon}
                      alt={`${user.name} profile`}
                      width={40}
                      height={40}
                      className="rounded-full w-[5vw] aspect-square"
                      onError={(e) => {
                        e.target.src = noIcon;
                      }}
                    />
                  </div>
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[15vw] text-[1.3vw]">
                    {user.name || "No name"}
                  </span>
                </td>
                <td
                  className={`py-[1vw] px-[2vh] ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"
                  } whitespace-nowrap overflow-hidden text-ellipsis max-w-[20vw] text-[1.3vw]`}
                >
                  {user.email || "No email"}
                </td>
                <td
                  className={`py-[1vw] px-[2vh] ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"
                  } whitespace-nowrap overflow-hidden text-ellipsis max-w-[10vw] text-[1.3vw]`}
                >
                  {user.phone || "No phone"}
                </td>
                <td
                  className={`py-[1vw] px-[2vh] rounded-r-[1vw] text-[1.3vw] ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"
                  }`}
                >
                  <span
                    className={`px-[1vw] py-[0.5vw] text-[1vw] rounded-full whitespace-nowrap ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-200 text-black/40"
                    }`}
                  >
                    {user.role || "user"}
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

      {/* User Detail Modal */}
      {selectedUser && (
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

              {/* Profile Image */}
              <div className="relative mb-6 flex flex-col items-center">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mb-4">
                  <Image
                    src={selectedUser.profile || noIcon}
                    alt={`${selectedUser.name}'s profile`}
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
                    {uploading ? "Uploading..." : "Change Profile Picture"}
                  </button>
                )}
              </div>

              {/* User Details */}
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
                    <h2 className="text-[1.5vw]">{selectedUser.name}</h2>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-[1vw]">Email</h3>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={editData.email}
                      onChange={handleEditChange}
                      className="border p-2 w-full text-[1.5vw]"
                    />
                  ) : (
                    <p className="text-gray-700 text-[1.5vw]">
                      {selectedUser.email}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-[1vw]">Telepon</h3>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={editData.phone}
                      onChange={handleEditChange}
                      className="border p-2 w-full text-[1.5vw]"
                    />
                  ) : (
                    <p className="text-gray-700 text-[1.5vw]">
                      {selectedUser.phone || "Tidak ada telepon"}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-[1vw]">Role</h3>
                  {isEditing ? (
                    <select
                      name="role"
                      value={editData.role}
                      onChange={handleEditChange}
                      className="border p-2 w-full text-[1.5vw]"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${
                        selectedUser.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {selectedUser.role || "user"}
                    </span>
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
                      onClick={deleteUser}
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

export default PenggunaTable;