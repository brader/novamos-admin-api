import { db } from "@/firebase/configure";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const ordersSnapshot = await db
      .collection("pesanan")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const orders = ordersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Ensure Firestore timestamp conversion
        order_date: data.order_date?.toDate
          ? {
              _seconds: Math.floor(data.order_date.toDate().getTime() / 1000),
              _nanoseconds: 0,
            }
          : data.order_date,
        // Transform userInfo to user if needed
        user:
          data.user ||
          (data.userInfo
            ? {
                id: data.userInfo.id,
                name: data.userInfo.name,
                email: data.userInfo.email,
                phone: data.userInfo.phone,
              }
            : null),
        // Transform shippingAddress to address if needed
        address:
          data.address ||
          (data.shippingAddress
            ? {
                address: data.shippingAddress.address,
                city: data.shippingAddress.city,
                subdistrict: data.shippingAddress.subdistrict,
              }
            : null),
        // Ensure proper date formats
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      };
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const orderData = await request.json();

    // Validate required fields
    if (
      !orderData.items ||
      !Array.isArray(orderData.items) ||
      orderData.items.length === 0
    ) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    // Transform incoming data to match frontend structure
    const transformedOrder = {
      // User transformation
      user:
        orderData.user ||
        (orderData.userInfo
          ? {
              id: orderData.userInfo.id,
              name: orderData.userInfo.name,
              email: orderData.userInfo.email,
              phone: orderData.userInfo.phone,
            }
          : null),

      // Address transformation
      address:
        orderData.address ||
        (orderData.shippingAddress
          ? {
              address: orderData.shippingAddress.address,
              city: orderData.shippingAddress.city,
              subdistrict: orderData.shippingAddress.subdistrict,
            }
          : null),

      // Items transformation
      items: orderData.items.map((item) => ({
        id: item.productId || item.id,
        title: item.name || item.title,
        price: item.price,
        weight: item.weight || item.berat || 0,
        qty: item.quantity || item.qty,
      })),

      // Other fields
      courier: orderData.courier || {
        name: orderData.courierName || "",
        service: orderData.courierService || "",
        price: orderData.shippingCost || 0,
        awb: "",
      },

      payment: orderData.payment || {
        method: orderData.payment_method,
        status: "pending",
      },

      status: orderData.status || [
        {
          title: "Pesanan Diterima",
          status: true,
          date: new Date().toISOString(),
        },
        {
          title: "Pesanan Dikonfirmasi",
          status: false,
          date: "",
        },
        {
          title: "Pesanan Dikirim",
          status: false,
          date: "",
        },
        {
          title: "Pesanan Sampai Tujuan",
          status: false,
          date: "",
        },
      ],

      // Dates
      order_date: {
        _seconds: Math.floor(Date.now() / 1000),
        _nanoseconds: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: null,

      // Copy other fields
      ...orderData,
    };

    // Remove duplicate/conflicting fields
    delete transformedOrder.userInfo;
    delete transformedOrder.shippingAddress;
    delete transformedOrder.payment_method;

    // Create order document
    const orderRef = await db.collection("pesanan").add(transformedOrder);

    return NextResponse.json(
      {
        id: orderRef.id,
        message: "Order created successfully",
        order: transformedOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
