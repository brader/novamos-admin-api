import { db } from "@/firebase/configure";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.user || !data.items || !data.address || !data.courier) {
      return NextResponse.json(
        { error: "Missing required fields (user, items, address, courier)" },
        { status: 400 }
      );
    }

    // Parse JSON strings if they come as strings
    const user = typeof data.user === 'string' ? JSON.parse(data.user) : data.user;
    const items = typeof data.items === 'string' ? JSON.parse(data.items) : data.items;
    const payment = typeof data.payment === 'string' ? JSON.parse(data.payment || '{}') : (data.payment || {});
    const address = typeof data.address === 'string' ? JSON.parse(data.address) : data.address;
    const courier = typeof data.courier === 'string' ? JSON.parse(data.courier) : data.courier;
    const status = typeof data.status === 'string' ? JSON.parse(data.status) : (data.status || []);

    // Calculate total price
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const total = subtotal + (courier.price || 0);

    // Create order document
    const orderData = {
      user: JSON.stringify(user),
      user_id: user.id,
      order_date: new Date().toISOString(),
      items: JSON.stringify(items),
      voucher: data.voucher || "",
      payment: JSON.stringify({
        payment: payment.payment || "transfer",
        image: payment.image || "",
        status: payment.status || "proses"
      }),
      address: JSON.stringify(address),
      courier: JSON.stringify(courier),
      status: JSON.stringify(status || [
        {
          title: "Pesanan Diterima",
          date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }),
          status: true
        },
        {
          title: "Pesanan Dikonfirmasi",
          date: "",
          status: false
        },
        {
          title: "Pengiriman",
          date: "",
          status: false
        },
        {
          title: "Sampai Tujuan",
          date: "",
          status: false
        }
      ]),
      subtotal,
      total,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const docRef = await db.collection("pesanan").add(orderData);

    return NextResponse.json({
      id: docRef.id,
      ...orderData,
      message: "Order created successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const snapshot = await db.collection("pesanan").get();

    const orders = [];
    snapshot.forEach((doc) => {
      const orderData = doc.data();
      
      // Parse all JSON string fields
      const parsedOrder = {
        id: doc.id,
        user: typeof orderData.user === 'string' ? JSON.parse(orderData.user) : orderData.user,
        order_date: orderData.order_date,
        items: typeof orderData.items === 'string' ? JSON.parse(orderData.items) : orderData.items,
        voucher: orderData.voucher,
        payment: typeof orderData.payment === 'string' ? JSON.parse(orderData.payment) : orderData.payment,
        address: typeof orderData.address === 'string' ? JSON.parse(orderData.address) : orderData.address,
        courier: typeof orderData.courier === 'string' ? JSON.parse(orderData.courier) : orderData.courier,
        status: typeof orderData.status === 'string' ? JSON.parse(orderData.status) : orderData.status,
        user_id: orderData.user_id,
        subtotal: orderData.subtotal,
        total: orderData.total,
        created_at: orderData.created_at,
        updated_at: orderData.updated_at
      };

      orders.push(parsedOrder);
    });

    // Sort orders by date (newest first)
    orders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
