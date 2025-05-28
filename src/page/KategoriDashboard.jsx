"use client"

import { useState, useRef } from "react"
import axios from "axios"
import Image from "next/image"
import KategoriTable from "@/components/KategoriTable"

const KategoriDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [kategori, setKategori] = useState(null)
  const [namaKategori, setNamaKategori] = useState("")
  const [image, setImage] = useState(null)
  const fileInputRef = useRef(null)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => {
    setIsModalOpen(false)
    setNamaKategori("")
    setImage(null)
  }

  const handleNamaKategoriChange = (e) => {
    setNamaKategori(e.target.value)
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  const removeImage = () => {
    setImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async () => {
    if (!namaKategori || !fileInputRef.current?.files[0]) {
      alert("Nama kategori dan gambar harus diisi")
      return
    }
  
    setIsLoading(true)
  
    try {
      const formData = new FormData()
      formData.append("namaKategori", namaKategori)
      formData.append("gambar", fileInputRef.current.files[0]) // real file
  
      const response = await axios.post('/api/v1/kategori', formData)
      // axios will auto set correct Content-Type
  
      if (response.status === 200) {
        setKategori(response.data)
        alert("Kategori berhasil ditambahkan")
        closeModal()
      }
    } catch (error) {
      console.error("Error adding category:", error)
      alert("Gagal menambahkan kategori")
    } finally {
      setIsLoading(false)
    }
  }
  

  return (
    <div className="py-[2vw] px-[3vh]">
      <div className="flex flex-col bg-white p-[3vw] rounded-[2vw]">
        <div className="flex flex-row justify-between px-[1vw]">
          <h1 className="text-[1.5vw] text-[#00C7BE]">Kategori</h1>
          <button
            onClick={openModal}
            className="flex flex-row align-center justify-center bg-[#F5F5F6] px-[0.8vw] py-[0.2vh] rounded-[0.8vw] aspect-square hover:bg-[#00C7BE] hover:text-white transition-colors"
          >
            <h1 className="text-[1.5vw]">+</h1>
          </button>
        </div>

        {/* Single row table */}
        <div className="mt-4 overflow-x-auto">
          <KategoriTable />
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-[2vw] rounded-[1vw] w-[50vw] max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-[1.5vw]">
                <h2 className="text-[1.5vw] font-semibold">Tambah Kategori</h2>
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
                />

                <div className="flex items-center gap-[1vw]">
                  <button
                    onClick={triggerFileInput}
                    className="flex-shrink-0 flex items-center justify-center w-[5vw] aspect-square border-2 border-dashed border-gray-300 rounded-[1vw] hover:border-[#00C7BE] transition-colors overflow-hidden"
                  >
                    {image ? (
                      <img
                        src={image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[1.5vw] text-gray-300 hover:text-[#00C7BE]">+</span>
                    )}
                  </button>
                  {image && (
                    <button
                      onClick={removeImage}
                      className="text-red-500 text-[0.8vw] hover:text-red-700"
                    >
                      Hapus Gambar
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-[1vw]">
                <div>
                  <label className="block text-[1vw] mb-[0.5vw]">Nama Kategori</label>
                  <input
                    type="text"
                    value={namaKategori}
                    onChange={handleNamaKategoriChange}
                    className="w-full p-[0.8vw] border rounded-[0.5vw] text-[1vw]"
                    placeholder="Masukkan nama kategori"
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
                  disabled={!namaKategori || !image || isLoading}
                  className={`px-[1.5vw] py-[0.5vw] rounded-[0.5vw] text-[1vw] ${
                    !namaKategori || !image || isLoading
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
  )
}

export default KategoriDashboard