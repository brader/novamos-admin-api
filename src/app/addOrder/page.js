const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

function generateDummyOrder(index) {
  const items = [
    {
      id: 1,
      title: "NOVAMOS Parfum Kucing dan Anjing",
      price: 19000,
      qty: Math.floor(Math.random() * 3) + 1,
    },
    {
      id: 2,
      title: "NOVAMOS Paket 2in1 Salep Scabies",
      price: 58000,
      qty: Math.floor(Math.random() * 2) + 1,
    },
  ];

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const courierPrice = [83000, 50000, 75000][Math.floor(Math.random() * 3)];
  const total = subtotal + courierPrice;

  const orderDate = admin.firestore.Timestamp.fromDate(
    new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
  );

  return {
    user: {
      id: index + 1,
      name: `User ${index + 1}`,
      email: `user${index + 1}@gmail.com`,
      phone: "8783110" + String(1000 + index),
    },
    items,
    address: {
      address: `Alamat Dummy ${index + 1}`,
      subdistrict: "TLOGOSARI KULON",
      district: "PEDURUNGAN",
      city: "SEMARANG",
      province: "JAWA TENGAH",
      zip: "50196",
      name: `User ${index + 1}`,
      phone: "8783110" + String(1000 + index),
    },
    courier: {
      name: "J&T Express",
      service: "EZ",
      price: courierPrice,
    },
    order_date: orderDate,
    status: [
      { title: "Pesanan Diterima", date: "14 February", status: true },
      { title: "Pesanan Diproses", date: "", status: false },
      { title: "Pesanan Dikirim", date: "", status: false },
    ],
    subtotal,
    total,
    payment: {
      method: "transfer",
      status: "pending",
      image: "",
    },
  };
}

// Loop insert 30 dummy orders
async function insertDummyOrders() {
  try {
    const promises = [];

    for (let i = 0; i < 30; i++) {
      const dummyOrder = generateDummyOrder(i);
      const promise = db.collection("pesanan").add(dummyOrder);
      promises.push(promise);
    }

    await Promise.all(promises);
    console.log("✅ 30 Dummy orders added!");
  } catch (error) {
    console.error("❌ Error adding dummy orders:", error);
  }
}

insertDummyOrders();
