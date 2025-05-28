import Image from "next/image";
import noIcon from "@/assett/noicon.png";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

const ProdukTable = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    description: "",
    price: "",
    berat: "",
    status: "",
    categoryId: "", // Add categoryId to editData
  });
  const [categories, setCategories] = useState([]); // State for categories
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories(); // Fetch categories when component mounts
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("/api/v1/produk");
      setProducts(response.data);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/v1/kategori");
      setCategories(response.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setCurrentImageIndex(0);
    setIsEditing(false);
    setEditData({
      name: product.name,
      description: product.description,
      price: product.price,
      berat: product.berat,
      status: product.status || "Ditunda",
      categoryId: product.categoryId || "", // Initialize categoryId
    });
  };

  const closeModal = () => {
    setSelectedProduct(null);
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
      name: selectedProduct.name,
      description: selectedProduct.description,
      price: selectedProduct.price,
      berat: selectedProduct.berat,
      status: selectedProduct.status || "Ditunda",
    });
  };

  const saveChanges = async () => {
    try {
      const response = await axios.put(
        `/api/v1/produk/${selectedProduct.id}`,
        editData
      );
      setProducts(
        products.map((p) => (p.id === selectedProduct.id ? response.data : p))
      );
      setSelectedProduct(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating product:", err);
      alert("Failed to update product");
    }
  };

  const deleteProduct = async () => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`/api/v1/produk/${selectedProduct.id}`);
        setProducts(products.filter((p) => p.id !== selectedProduct.id));
        closeModal();
      } catch (err) {
        console.error("Error deleting product:", err);
        alert("Failed to delete product");
      }
    }
  };

  const deleteImage = async (imageIndex) => {
    if (confirm("Are you sure you want to delete this image?")) {
      try {
        const imageToDelete = selectedProduct.images[imageIndex];
        
        // First delete from storage
        await axios.delete(`/api/v1/produk/${selectedProduct.id}/images`, {
          data: { imageUrl: imageToDelete }
        });

        // Then update the product's image list
        const updatedImages = [...selectedProduct.images];
        updatedImages.splice(imageIndex, 1);

        const response = await axios.put(
          `/api/v1/produk/${selectedProduct.id}`,
          { images: updatedImages }
        );

        setSelectedProduct(response.data);
        setProducts(
          products.map((p) => (p.id === selectedProduct.id ? response.data : p))
        );

        // Reset current image index if we deleted the current image
        if (currentImageIndex >= updatedImages.length) {
          setCurrentImageIndex(Math.max(0, updatedImages.length - 1));
        }
      } catch (err) {
        console.error("Error deleting image:", err);
        alert("Failed to delete image");
      }
    }
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
      }

      const uploadResponse = await axios.post(
        `/api/v1/produk/${selectedProduct.id}/images`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedProduct = uploadResponse.data;
      setSelectedProduct(updatedProduct);
      setProducts(
        products.map((p) => (p.id === selectedProduct.id ? updatedProduct : p))
      );

      // Set current image to the first newly uploaded image if there were no images before
      if (selectedProduct.images.length === 0) {
        setCurrentImageIndex(0);
      }
    } catch (err) {
      console.error("Error uploading images:", err);
      alert("Failed to upload images");
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset file input
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const nextImage = () => {
    setCurrentImageIndex(
      (prevIndex) => (prevIndex + 1) % selectedProduct.images.length
    );
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prevIndex) =>
        (prevIndex - 1 + selectedProduct.images.length) %
        selectedProduct.images.length
    );
  };

  if (loading) {
    return <div className="text-center py-4">Sedang memuat...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  if (products.length === 0) {
    return <div className="text-center py-4">Tidak di temukan produk</div>;
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
                Deskripsi
              </th>
              <th className="py-3 px-4 text-left text-black/40 font-semibold text-[1.3vw]">
                Harga
              </th>
              <th className="py-3 px-4 text-left text-black/40 font-semibold text-[1.3vw]">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr
                key={product.id}
                className="bg-white transition-colors hover:bg-gray-50 cursor-pointer"
                onClick={() => openProductModal(product)}
              >
                <td
                  className={`py-[1vw] px-[2vh] flex ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"
                  } items-center rounded-l-[1vw]`}
                >
                  <div className="flex-shrink-0 w-[3vw] rounded-full mr-3">
                    <Image
                      src={product.images?.[0] || noIcon}
                      alt={`${product.name} icon`}
                      width={40}
                      height={40}
                      className="rounded-[1vw] w-[5vw] aspect-square"
                      onError={(e) => {
                        e.target.src = noIcon;
                      }}
                    />
                  </div>
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[15vw] text-[1.3vw]">
                    {product.name || "No title"}
                  </span>
                </td>
                <td
                  className={`py-[1vw] px-[2vh] ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"
                  } whitespace-nowrap overflow-hidden text-ellipsis max-w-[20vw] text-[1.3vw]`}
                >
                  {product.description || "No description"}
                </td>
                <td
                  className={`py-[1vw] px-[2vh] ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"
                  } whitespace-nowrap overflow-hidden text-ellipsis max-w-[10vw] text-[1.3vw]`}
                >
                  {product.price
                    ? `Rp ${product.price.toLocaleString()}`
                    : "Rp 0"}
                </td>
                <td
                  className={`py-[1vw] px-[2vh] rounded-r-[1vw] text-[1.3vw] ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"
                  }`}
                >
                  <span
                    className={`px-[1vw] py-[0.5vw] text-[1vw] rounded-full whitespace-nowrap ${
                      product.status === "Tayang"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-200 text-black/40"
                    }`}
                  >
                    {product.status || "Ditunda"}
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
        multiple
        accept="image/*"
        style={{ display: "none" }}
      />

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>

              {/* Image Carousel */}
              <div className="relative mb-6">
                <div className="flex overflow-hidden rounded-lg bg-gray-100">
                  {selectedProduct.images.length > 0 ? (
                    <Image
                      src={selectedProduct.images[currentImageIndex] || noIcon}
                      alt={`${selectedProduct.name} - Image ${
                        currentImageIndex + 1
                      }`}
                      width={800}
                      height={600}
                      className="w-full h-64 object-contain"
                      onError={(e) => {
                        e.target.src = noIcon;
                      }}
                    />
                  ) : (
                    <div className="w-full h-64 flex items-center justify-center bg-gray-100">
                      <span className="text-gray-400">No images available</span>
                    </div>
                  )}
                </div>

                {selectedProduct.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                    >
                      &lt;
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                    >
                      &gt;
                    </button>
                    <div className="flex justify-center mt-2 space-x-2">
                      {selectedProduct.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full ${
                            index === currentImageIndex
                              ? "bg-blue-500"
                              : "bg-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Image action buttons */}
                {isEditing && (
                  <div className="absolute top-2 right-2 flex space-x-2">
                    {selectedProduct.images.length > 0 && (
                      <button
                        onClick={() => deleteImage(currentImageIndex)}
                        className="bg-red-500 text-white rounded-full p-2 shadow-md hover:bg-red-600"
                        title="Delete current image"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={triggerFileInput}
                      className="bg-blue-500 text-white rounded-full p-2 shadow-md hover:bg-blue-600"
                      title="Add new images"
                      disabled={uploading}
                    >
                      {uploading ? (
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-semibold text-[1vw]">Judul</h3>
                  <h2 className="text-[1.5vw]">
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={editData.name}
                        onChange={handleEditChange}
                        className="border p-2 w-full"
                      />
                    ) : (
                      selectedProduct.name
                    )}
                  </h2>
                </div>
                <div>
                  <h3 className="font-semibold text-[1vw] mb-2">Deskripsi</h3>
                  {isEditing ? (
                    <textarea
                      name="description"
                      value={editData.description}
                      onChange={handleEditChange}
                      className="border p-2 w-full"
                      rows={4}
                    />
                  ) : (
                    <p className="text-gray-700 text-[1.5vw]">
                      {selectedProduct.description || "Tidak ada deskripsi"}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-[1vw] mb-2">Harga</h3>
                    {isEditing ? (
                      <input
                        type="number"
                        name="price"
                        value={editData.price}
                        onChange={handleEditChange}
                        className="border p-2 w-full"
                      />
                    ) : (
                      <p className="text-gray-700 text-[1.5vw]">
                        {selectedProduct.price
                          ? `Rp ${selectedProduct.price.toLocaleString()}`
                          : "Rp 0"}
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-[1vw] mb-2">
                      Berat (gram)
                    </h3>
                    {isEditing ? (
                      <input
                        type="number"
                        name="berat"
                        value={editData.berat}
                        onChange={handleEditChange}
                        className="border p-2 w-full"
                      />
                    ) : (
                      <p className="text-gray-700 text-[1.5vw]">
                        {selectedProduct.berat || "Tidak diketahui"}
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-[1vw] mb-2">Kategori</h3>
                    {isEditing ? (
                      <select
                        name="categoryId"
                        value={editData.categoryId}
                        onChange={handleEditChange}
                        className="border p-2 w-full text-[1.5vw]"
                      >
                        <option value="">Pilih Kategori</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-700 text-[1.5vw]">
                        {categories.find(c => c.id === selectedProduct.categoryId)?.name || "Tidak ada kategori"}
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-[1vw] mb-2">Status</h3>
                    {isEditing ? (
                      <select
                        name="status"
                        value={editData.status}
                        onChange={handleEditChange}
                        className="border p-2 w-full text-[1.5vw]"
                      >
                        <option value="Tayang">Tayang</option>
                        <option value="Ditunda">Ditunda</option>
                      </select>
                    ) : (
                      <span
                        className={`px-3 py-1 text-sm rounded-full ${
                          selectedProduct.status === "Tayang"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        {selectedProduct.status || "Ditunda"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Thumbnail Gallery */}
              <div className="mt-6">
                <h3 className="font-semibold mb-2 text-[1.5vw]">
                  Gambar Produk
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.images.length > 0 ? (
                    selectedProduct.images.map((image, index) => (
                      <div
                        key={index}
                        className={`relative w-16 h-16 cursor-pointer border-2 rounded-md overflow-hidden ${
                          index === currentImageIndex
                            ? "border-blue-500"
                            : "border-transparent"
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <Image
                          src={image || noIcon}
                          alt={`Thumbnail ${index + 1}`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = noIcon;
                          }}
                        />
                        {isEditing && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteImage(index);
                            }}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                            style={{ transform: "translate(30%, -30%)" }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400">No images available</div>
                  )}
                  {isEditing && (
                    <button
                      onClick={triggerFileInput}
                      className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50"
                      disabled={uploading}
                    >
                      {uploading ? (
                        <svg
                          className="animate-spin h-5 w-5 text-gray-400"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      )}
                    </button>
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
                      onClick={deleteProduct}
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

export default ProdukTable;