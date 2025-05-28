import { useState, useEffect } from "react";
import axios from "axios";

const PesananTable = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [awbNumber, setAwbNumber] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get("/api/v1/pesanan");
      setOrders(response.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    // Get current AWB number from courier data if exists
    const currentAwb = order.courier?.awb || "";
    setAwbNumber(currentAwb);
    // Get current status from the first completed status step
    const currentStatus = order.status?.find((s) => s.status)?.title || "";
    setStatus(currentStatus);
    setShowModal(true);
  };

  const handleUpdateStatus = async () => {
    try {
      // Prepare the update payload
      const updatePayload = {
        awbNumber: awbNumber.trim(),
        status,
      };

      // Validate inputs
      if (updatePayload.status === "Pengiriman" && !updatePayload.awbNumber) {
        alert("Nomor AWB harus diisi untuk status Pengiriman");
        return;
      }

      // Send the update request
      const response = await axios.put(
        `/api/v1/pesanan/${selectedOrder.id}`,
        updatePayload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Handle successful update (modified success check)
      if (response.status === 200 || response.status === 204) {
        await fetchOrders(); // Wait for refresh to complete
        setShowModal(false);
        alert("Status pesanan berhasil diperbarui!");
      } else {
        console.warn("Unexpected response:", response);
        throw new Error("Format respons tidak dikenali");
      }
    } catch (err) {
      // More specific error handling
      if (err.response) {
        // The request was made and server responded with error status
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
        // The request was made but no response received
        console.error("No response received:", err.request);
        alert("Tidak ada respons dari server. Cek koneksi internet Anda.");
      } else {
        // Something happened in setting up the request
        console.error("Request setup error:", err.message);
        alert(`Error: ${err.message}`);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-4">Sedang memuat...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  if (orders.length === 0) {
    return <div className="text-center py-4">Tidak ditemukan pesanan</div>;
  }

  return (
    <div>
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
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => {
              // Get current status from the first completed status step
              const currentStatus =
                order.status?.find((s) => s.status)?.title || "Pending";
              return (
                <tr
                  key={order.id}
                  className={`bg-white cursor-pointer ${
                    index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"
                  }`}
                  onClick={() => handleOrderClick(order)}
                >
                  <td className="py-4 px-4 rounded-l-[1vw]">{order.id}</td>
                  <td className="py-4 px-4">{order.user?.name || "N/A"}</td>
                  <td className="py-4 px-4">
                    {order.order_date?.toDate
                      ? order.order_date.toDate().toLocaleDateString("id-ID", {
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
                  <td className="py-4 px-4 rounded-r-[1vw]">
                    <span
                      className={`px-[1vw] py-[0.5vw] text-xs rounded-full whitespace-nowrap ${
                        currentStatus === "Sampai di Tujuan"
                          ? "bg-green-100 text-green-800"
                          : currentStatus === "Pengiriman"
                          ? "bg-blue-100 text-blue-800"
                          : currentStatus === "Pesanan Dikonfirmasi"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-200 text-black/40"
                      }`}
                    >
                      {currentStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-700">
                    Informasi Pelanggan
                  </h3>
                  <div className="mt-2 space-y-2">
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
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">
                    Informasi Pengiriman
                  </h3>
                  <div className="mt-2 space-y-2">
                    <p>
                      <span className="text-gray-500">Kurir:</span>{" "}
                      {selectedOrder.courier?.name || "N/A"} (
                      {selectedOrder.courier?.service || "N/A"})
                    </p>
                    <p>
                      <span className="text-gray-500">Ongkir:</span> Rp{" "}
                      {selectedOrder.courier?.price?.toLocaleString("id-ID") ||
                        "0"}
                    </p>
                    <p>
                      <span className="text-gray-500">Alamat:</span>{" "}
                      {selectedOrder.address?.address || "N/A"},{" "}
                      {selectedOrder.address?.subdistrict || "N/A"},{" "}
                      {selectedOrder.address?.city || "N/A"}
                    </p>
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
                  <option value="Pengiriman">Pengiriman</option>
                  <option value="Sampai di Tujuan">Sampai di Tujuan</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                >
                  Tutup
                </button>
                <button
                  onClick={handleUpdateStatus}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PesananTable;
