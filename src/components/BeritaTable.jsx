import Image from "next/image";
import noIcon from "@/assett/noicon.png";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

const BeritaTable = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    body: "",
    category: "",
    date: "",
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await axios.get("/api/v1/berita");
      setArticles(response.data || []);
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError("Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  const openArticleModal = (article) => {
    setSelectedArticle(article);
    setIsEditing(false);
    setEditData({
      title: article.title || "",
      body: article.body || "",
      category: article.category || "",
      date: article.date ? article.date.split('T')[0] : "",
    });
  };

  const closeModal = () => {
    setSelectedArticle(null);
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
      title: selectedArticle.title || "",
      body: selectedArticle.body || "",
      category: selectedArticle.category || "",
      date: selectedArticle.date ? selectedArticle.date.split('T')[0] : "",
    });
  };

  const saveChanges = async () => {
    try {
      const response = await axios.put(
        `/api/v1/berita/${selectedArticle.id}`,
        editData
      );
      setArticles(
        articles.map((a) => (a.id === selectedArticle.id ? response.data : a))
      );
      setSelectedArticle(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating article:", err);
      alert("Failed to update article");
    }
  };

  const deleteArticle = async () => {
    if (confirm("Are you sure you want to delete this article?")) {
      try {
        await axios.delete(`/api/v1/berita/${selectedArticle.id}`);
        setArticles(articles.filter((a) => a.id !== selectedArticle.id));
        closeModal();
      } catch (err) {
        console.error("Error deleting article:", err);
        alert("Failed to delete article");
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
        `/api/v1/berita/${selectedArticle.id}/image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedArticle = uploadResponse.data;
      setSelectedArticle(updatedArticle);
      setArticles(
        articles.map((a) => (a.id === selectedArticle.id ? updatedArticle : a))
      );
    } catch (err) {
      console.error("Error uploading article image:", err);
      alert("Failed to upload article image");
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

  if (articles.length === 0) {
    return <div className="text-center py-4">Tidak ditemukan berita</div>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border-separate border-spacing-y-2">
          <thead className="bg-white">
            <tr>
              <th className="py-3 px-4 text-left text-black/40 font-semibold text-[1.3vw]">
                Judul
              </th>
              <th className="py-3 px-4 text-left text-black/40 font-semibold text-[1.3vw]">
                Kategori
              </th>
              <th className="py-3 px-4 text-left text-black/40 font-semibold text-[1.3vw]">
                Isi
              </th>
              <th className="py-3 px-4 text-left text-black/40 font-semibold text-[1.3vw]">
                Tanggal
              </th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article, index) => (
              <tr
                key={article.id}
                className="bg-white transition-colors hover:bg-gray-50 cursor-pointer"
                onClick={() => openArticleModal(article)}
              >
                <td
                  className={`py-[1vw] px-[2vh] flex ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"
                  } items-center rounded-l-[1vw]`}
                >
                  <div className="flex-shrink-0 w-[3vw] rounded-full mr-3">
                    <Image
                      src={article.image || noIcon}
                      alt={`${article.title} image`}
                      width={40}
                      height={40}
                      className="rounded-full w-[5vw] aspect-square"
                      onError={(e) => {
                        e.target.src = noIcon;
                      }}
                    />
                  </div>
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[15vw] text-[1.3vw]">
                    {article.title || "No title"}
                  </span>
                </td>
                <td
                  className={`py-[1vw] px-[2vh] ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"
                  } whitespace-nowrap overflow-hidden text-ellipsis max-w-[20vw] text-[1.3vw]`}
                >
                  {article.category || "No category"}
                </td>
                <td
                  className={`py-[1vw] px-[2vh] ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"
                  } whitespace-nowrap overflow-hidden text-ellipsis max-w-[10vw] text-[1.3vw]`}
                >
                  {article.body ? `${article.body.substring(0, 50)}...` : "No content"}
                </td>
                <td
                  className={`py-[1vw] px-[2vh] rounded-r-[1vw] text-[1.3vw] ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"
                  }`}
                >
                  {article.date ? new Date(article.date).toLocaleDateString() : "No date"}
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

      {/* Article Detail Modal */}
      {selectedArticle && (
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

              {/* Article Image */}
              <div className="relative mb-6 flex flex-col items-center">
                <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100 mb-4">
                  <Image
                    src={selectedArticle.image || noIcon}
                    alt={`${selectedArticle.title}'s image`}
                    width={600}
                    height={300}
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
                    {uploading ? "Uploading..." : "Change Article Image"}
                  </button>
                )}
              </div>

              {/* Article Details */}
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-semibold text-[1vw]">Judul</h3>
                  {isEditing ? (
                    <input
                      type="text"
                      name="title"
                      value={editData.title}
                      onChange={handleEditChange}
                      className="border p-2 w-full text-[1.5vw]"
                    />
                  ) : (
                    <h2 className="text-[1.5vw]">{selectedArticle.title}</h2>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-[1vw]">Kategori</h3>
                  {isEditing ? (
                    <input
                      type="text"
                      name="category"
                      value={editData.category}
                      onChange={handleEditChange}
                      className="border p-2 w-full text-[1.5vw]"
                    />
                  ) : (
                    <p className="text-gray-700 text-[1.5vw]">
                      {selectedArticle.category}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-[1vw]">Isi</h3>
                  {isEditing ? (
                    <textarea
                      name="body"
                      value={editData.body}
                      onChange={handleEditChange}
                      className="border p-2 w-full text-[1.5vw]"
                      rows="6"
                    />
                  ) : (
                    <p className="text-gray-700 text-[1.5vw] whitespace-pre-line">
                      {selectedArticle.body}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-[1vw]">Tanggal</h3>
                  {isEditing ? (
                    <input
                      type="date"
                      name="date"
                      value={editData.date}
                      onChange={handleEditChange}
                      className="border p-2 w-full text-[1.5vw]"
                    />
                  ) : (
                    <p className="text-gray-700 text-[1.5vw]">
                      {selectedArticle.date ? new Date(selectedArticle.date).toLocaleDateString() : "Tidak ada tanggal"}
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
                      onClick={deleteArticle}
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

export default BeritaTable;