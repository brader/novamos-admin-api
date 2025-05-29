import { useState, useEffect } from "react";
import axios from "axios";
import { CSVLink } from "react-csv";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const PesananTable = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [awbNumber, setAwbNumber] = useState("");
  const [status, setStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedOrder, setEditedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, startDate, endDate]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get("/api/v1/pesanan");
      setOrders(response.data);
      setFilteredOrders(response.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let result = [...orders];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (order) =>
          order.id.toString().includes(term) ||
          (order.user?.name && order.user.name.toLowerCase().includes(term)) ||
          (order.user?.email && order.user.email.toLowerCase().includes(term)) ||
          (order.user?.phone && order.user.phone.includes(term)) ||
          (order.address?.address &&
            order.address.address.toLowerCase().includes(term))
      );
    }

    // Filter by date range
    if (startDate && endDate) {
      result = result.filter((order) => {
        const orderDate = order.order_date?.toDate
          ? order.order_date.toDate()
          : new Date(order.order_date._seconds * 1000);
        return orderDate >= startDate && orderDate <= endDate;
      });
    } else if (startDate) {
      result = result.filter((order) => {
        const orderDate = order.order_date?.toDate
          ? order.order_date.toDate()
          : new Date(order.order_date._seconds * 1000);
        return orderDate >= startDate;
      });
    } else if (endDate) {
      result = result.filter((order) => {
        const orderDate = order.order_date?.toDate
          ? order.order_date.toDate()
          : new Date(order.order_date._seconds * 1000);
        return orderDate <= endDate;
      });
    }

    setFilteredOrders(result);
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setEditedOrder(null);
    setEditMode(false);
    const currentAwb = order.courier?.awb || "";
    setAwbNumber(currentAwb);
    const currentStatus = order.status?.find((s) => s.status)?.title || "";
    setStatus(currentStatus);
    setShowModal(true);
  };

  const handleEditOrder = () => {
    setEditMode(true);
    setEditedOrder({
      ...selectedOrder,
      user: { ...selectedOrder.user },
      address: { ...selectedOrder.address },
      courier: { ...selectedOrder.courier },
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setEditedOrder({
        ...editedOrder,
        [parent]: {
          ...editedOrder[parent],
          [child]: value,
        },
      });
    } else {
      setEditedOrder({
        ...editedOrder,
        [name]: value,
      });
    }
  };

  const handleSaveEdit = async () => {
    try {
      const response = await axios.put(
        `/api/v1/pesanan/${editedOrder.id}`,
        editedOrder
      );
      if (response.status === 200 || response.status === 204) {
        await fetchOrders();
        setEditMode(false);
        setSelectedOrder(editedOrder);
        alert("Pesanan berhasil diperbarui!");
      }
    } catch (err) {
      console.error("Error updating order:", err);
      alert("Gagal memperbarui pesanan");
    }
  };

  const handleDeleteClick = (order) => {
    setOrderToDelete(order);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.delete(`/api/v1/pesanan/${orderToDelete.id}`);
      if (response.status === 200 || response.status === 204) {
        await fetchOrders();
        setShowDeleteConfirm(false);
        alert("Pesanan berhasil dihapus!");
      }
    } catch (err) {
      console.error("Error deleting order:", err);
      alert("Gagal menghapus pesanan");
    }
  };

  const handleUpdateStatus = async () => {
    try {
      const updatePayload = {
        awbNumber: awbNumber.trim(),
        status,
      };

      if (updatePayload.status === "Pengiriman" && !updatePayload.awbNumber) {
        alert("Nomor AWB harus diisi untuk status Pengiriman");
        return;
      }

      const response = await axios.put(
        `/api/v1/pesanan/${selectedOrder.id}`,
        updatePayload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 || response.status === 204) {
        await fetchOrders();
        setShowModal(false);
        alert("Status pesanan berhasil diperbarui!");
      } else {
        console.warn("Unexpected response:", response);
        throw new Error("Format respons tidak dikenali");
      }
    } catch (err) {
      if (err.response) {
        console.error("Server responded with error:", {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers,
        });
        alert(
          `Error dari server: ${
            err.response.data?.message || err.response.statusText
          }`
        );
      } else if (err.request) {
        console.error("No response received:", err.request);
        alert("Tidak ada respons dari server. Cek koneksi internet Anda.");
      } else {
        console.error("Request setup error:", err.message);
        alert(`Error: ${err.message}`);
      }
    }
  };

  const prepareCSVData = () => {
    const headers = [
      { label: "ID Order", key: "id" },
      { label: "Nama Pelanggan", key: "user.name" },
      { label: "Email", key: "user.email" },
      { label: "Telepon", key: "user.phone" },
      { label: "Tanggal Pesanan", key: "order_date" },
      { label: "Alamat", key: "address.address" },
      { label: "Kota", key: "address.city" },
      { label: "Kurir", key: "courier.name" },
      { label: "Layanan Kurir", key: "courier.service" },
      { label: "Ongkir", key: "courier.price" },
      { label: "Subtotal", key: "subtotal" },
      { label: "Total", key: "total" },
      { label: "Status", key: "status" },
      { label: "Nomor AWB", key: "courier.awb" },
    ];

    const data = filteredOrders.map((order) => {
      const statusOrder = [
        "Pesanan Diterima",
        "Pesanan Dikonfirmasi",
        "Pesanan Dikirim",
        "Pesanan Sampai Tujuan",
      ];

      const completedStatuses = order.status?.filter((s) => s.status) || [];
      let currentStatus = "Pending";
      for (let i = statusOrder.length - 1; i >= 0; i--) {
        const found = completedStatuses.find((s) => s.title === statusOrder[i]);
        if (found) {
          currentStatus = found.title;
          break;
        }
      }

      return {
        ...order,
        "user.name": order.user?.name || "",
        "user.email": order.user?.email || "",
        "user.phone": order.user?.phone || "",
        order_date: order.order_date?.toDate
          ? order.order_date.toDate().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : new Date(order.order_date._seconds * 1000).toLocaleDateString(
              "id-ID",
              {
                day: "numeric",
                month: "long",
                year: "numeric",
              }
            ),
        "address.address": order.address?.address || "",
        "address.city": order.address?.city || "",
        "courier.name": order.courier?.name || "",
        "courier.service": order.courier?.service || "",
        "courier.price": order.courier?.price || 0,
        subtotal: order.subtotal || 0,
        total: order.total || 0,
        status: currentStatus,
        "courier.awb": order.courier?.awb || "",
      };
    });

    return { data, headers };
  };

  const { data: csvData, headers: csvHeaders } = prepareCSVData();

  if (loading) {
    return <div className="text-center py-4">Sedang memuat...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4">
      {/* Search and Filter Section */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="w-full md:w-1/3">
            <input
              type="text"
              placeholder="Cari berdasarkan ID, nama, email, atau alamat..."
              className="border rounded px-3 py-2 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-2/3">
            <div className="flex items-center gap-2">
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                placeholderText="Dari Tanggal"
                className="border rounded px-3 py-2"
                dateFormat="dd/MM/yyyy"
              />
              <span>s/d</span>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                placeholderText="Sampai Tanggal"
                className="border rounded px-3 py-2"
                dateFormat="dd/MM/yyyy"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate(null);
                    setEndDate(null);
                  }}
                  className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="ml-auto">
              <CSVLink
                data={csvData}
                headers={csvHeaders}
                filename={`pesanan-${new Date().toISOString()}.csv`}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Export to CSV
              </CSVLink>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8">Tidak ditemukan pesanan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border-separate border-spacing-y-2">
              <thead className="bg-white">
                <tr>
                  <th className="py-3 px-4 text-left text-black/40 font-semibold">
                    ID Order
                  </th>
                  <th className="py-3 px-4 text-left text-black/40 font-semibold">
                    Nama Pelanggan
                  </th>
                  <th className="py-3 px-4 text-left text-black/40 font-semibold">
                    Tanggal
                  </th>
                  <th className="py-3 px-4 text-left text-black/40 font-semibold">
                    Total
                  </th>
                  <th className="py-3 px-4 text-left text-black/40 font-semibold">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left text-black/40 font-semibold">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => {
                  const statusOrder = [
                    "Pesanan Diterima",
                    "Pesanan Dikonfirmasi",
                    "Pesanan Dikirim",
                    "Pesanan Sampai Tujuan",
                  ];

                  const completedStatuses =
                    order.status?.filter((s) => s.status) || [];

                  let currentStatus = "Pending";
                  for (let i = statusOrder.length - 1; i >= 0; i--) {
                    const found = completedStatuses.find(
                      (s) => s.title === statusOrder[i]
                    );
                    if (found) {
                      currentStatus = found.title;
                      break;
                    }
                  }

                  const phoneNumber = order.user?.phone
                    ? order.user.phone.startsWith("0")
                      ? `62${order.user.phone.substring(1)}`
                      : order.user.phone.startsWith("+62")
                      ? order.user.phone.substring(1)
                      : order.user.phone
                    : "";

                  return (
                    <tr
                      key={order.id}
                      className={`bg-white ${
                        index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"
                      }`}
                    >
                      <td className="py-4 px-4 rounded-l-[1vw]">{order.id}</td>
                      <td className="py-4 px-4">{order.user?.name || "N/A"}</td>
                      <td className="py-4 px-4">
                        {order.order_date?.toDate
                          ? order.order_date
                              .toDate()
                              .toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                          : new Date(
                              order.order_date._seconds * 1000
                            ).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                      </td>
                      <td className="py-4 px-4">
                        Rp {order.total?.toLocaleString("id-ID") || "0"}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-[1vw] py-[0.5vw] text-xs rounded-full whitespace-nowrap ${
                            currentStatus === "Pesanan Sampai Tujuan"
                              ? "bg-green-100 text-green-800"
                              : currentStatus === "Pesanan Dikirim"
                              ? "bg-blue-100 text-blue-800"
                              : currentStatus === "Pesanan Dikonfirmasi"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-200 text-black/40"
                          }`}
                        >
                          {currentStatus}
                        </span>
                      </td>
                      <td className="py-4 px-4 rounded-r-[1vw] flex gap-2">
                        <button
                          onClick={() => handleOrderClick(order)}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm"
                        >
                          Detail
                        </button>
                        {phoneNumber && (
                          <a
                            href={`https://wa.me/${phoneNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 text-sm"
                          >
                            WhatsApp
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteClick(order)}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  Detail Pesanan #{selectedOrder.id}
                </h2>
                <div className="flex gap-2">
                  {!editMode && (
                    <button
                      onClick={handleEditOrder}
                      className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 text-sm"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    &times;
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-700">
                    Informasi Pelanggan
                  </h3>
                  <div className="mt-2 space-y-2">
                    {editMode ? (
                      <>
                        <div>
                          <label className="text-gray-500">Nama:</label>
                          <input
                            type="text"
                            name="user.name"
                            value={editedOrder.user.name || ""}
                            onChange={handleEditChange}
                            className="border rounded px-2 py-1 w-full"
                          />
                        </div>
                        <div>
                          <label className="text-gray-500">Email:</label>
                          <input
                            type="email"
                            name="user.email"
                            value={editedOrder.user.email || ""}
                            onChange={handleEditChange}
                            className="border rounded px-2 py-1 w-full"
                          />
                        </div>
                        <div>
                          <label className="text-gray-500">Telepon:</label>
                          <input
                            type="text"
                            name="user.phone"
                            value={editedOrder.user.phone || ""}
                            onChange={handleEditChange}
                            className="border rounded px-2 py-1 w-full"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <p>
                          <span className="text-gray-500">Nama:</span>{" "}
                          {selectedOrder.user?.name || "N/A"}
                        </p>
                        <p>
                          <span className="text-gray-500">Email:</span>{" "}
                          {selectedOrder.user?.email || "N/A"}
                        </p>
                        <p>
                          <span className="text-gray-500">Telepon:</span>{" "}
                          {selectedOrder.user?.phone || "N/A"}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">
                    Informasi Pengiriman
                  </h3>
                  <div className="mt-2 space-y-2">
                    {editMode ? (
                      <>
                        <div>
                          <label className="text-gray-500">Kurir:</label>
                          <input
                            type="text"
                            name="courier.name"
                            value={editedOrder.courier.name || ""}
                            onChange={handleEditChange}
                            className="border rounded px-2 py-1 w-full"
                          />
                        </div>
                        <div>
                          <label className="text-gray-500">Layanan:</label>
                          <input
                            type="text"
                            name="courier.service"
                            value={editedOrder.courier.service || ""}
                            onChange={handleEditChange}
                            className="border rounded px-2 py-1 w-full"
                          />
                        </div>
                        <div>
                          <label className="text-gray-500">Ongkir:</label>
                          <input
                            type="number"
                            name="courier.price"
                            value={editedOrder.courier.price || ""}
                            onChange={handleEditChange}
                            className="border rounded px-2 py-1 w-full"
                          />
                        </div>
                        <div>
                          <label className="text-gray-500">Alamat:</label>
                          <textarea
                            name="address.address"
                            value={editedOrder.address.address || ""}
                            onChange={handleEditChange}
                            className="border rounded px-2 py-1 w-full"
                            rows="2"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <p>
                          <span className="text-gray-500">Kurir:</span>{" "}
                          {selectedOrder.courier?.name || "N/A"} (
                          {selectedOrder.courier?.service || "N/A"})
                        </p>
                        <p>
                          <span className="text-gray-500">Ongkir:</span> Rp{" "}
                          {selectedOrder.courier?.price?.toLocaleString(
                            "id-ID"
                          ) || "0"}
                        </p>
                        <p>
                          <span className="text-gray-500">Alamat:</span>{" "}
                          {selectedOrder.address?.address || "N/A"},{" "}
                          {selectedOrder.address?.subdistrict || "N/A"},{" "}
                          {selectedOrder.address?.city || "N/A"}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">
                  Daftar Produk
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-2 px-4 text-left">Produk</th>
                        <th className="py-2 px-4 text-left">Qty</th>
                        <th className="py-2 px-4 text-left">Harga</th>
                        <th className="py-2 px-4 text-left">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="py-2 px-4">{item.title}</td>
                          <td className="py-2 px-4">{item.qty}</td>
                          <td className="py-2 px-4">
                            Rp {item.price?.toLocaleString("id-ID")}
                          </td>
                          <td className="py-2 px-4">
                            Rp{" "}
                            {(item.qty * item.price)?.toLocaleString("id-ID")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">
                  Ringkasan Pembayaran
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span>Subtotal:</span>
                    <span>
                      Rp{" "}
                      {selectedOrder.subtotal?.toLocaleString("id-ID") || "0"}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Ongkos Kirim:</span>
                    <span>
                      Rp{" "}
                      {selectedOrder.courier?.price?.toLocaleString("id-ID") ||
                        "0"}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>
                      Rp {selectedOrder.total?.toLocaleString("id-ID") || "0"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">
                  Status Pesanan
                </h3>
                <div className="space-y-4">
                  {selectedOrder.status?.map((step, index) => (
                    <div key={index} className="flex items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                          step.status
                            ? "bg-green-500 text-white"
                            : "bg-gray-200"
                        }`}
                      >
                        {step.status ? "✓" : index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{step.title}</p>
                        {step.date && (
                          <p className="text-sm text-gray-500">{step.date}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">
                  Nomor Resi (AWB)
                </h3>
                <input
                  type="text"
                  value={awbNumber}
                  onChange={(e) => setAwbNumber(e.target.value)}
                  placeholder="Masukkan nomor AWB"
                  className="border rounded px-3 py-2 w-full"
                />
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">
                  Update Status
                </h3>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="border rounded px-3 py-2 w-full"
                >
                  <option value="">Pilih Status</option>
                  <option value="Pesanan Diterima">Pesanan Diterima</option>
                  <option value="Pesanan Dikonfirmasi">
                    Pesanan Dikonfirmasi
                  </option>
                  <option value="Pesanan Dikirim">Pesanan Dikirim</option>
                  <option value="Pesanan Sampai Tujuan">
                    Pesanan Sampai Tujuan
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                >
                  Tutup
                </button>
                {editMode ? (
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                    Simpan Perubahan
                  </button>
                ) : (
                  <button
                    onClick={handleUpdateStatus}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Simpan Status
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Konfirmasi Hapus Pesanan</h3>
            <p>
              Apakah Anda yakin ingin menghapus pesanan #{orderToDelete.id} dari{" "}
              {orderToDelete.user?.name || "pelanggan"}?
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PesananTable;