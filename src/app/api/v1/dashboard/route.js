// app/api/v1/dashboard/route.js
import { db } from '@/firebase/configure';
import { subMonths, format } from 'date-fns';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const currentDate = new Date();
    const previousMonth = subMonths(currentDate, 1);

    const [
      ordersSnapshot, 
      productsSnapshot, 
      usersSnapshot,
      prevMonthOrders,
      prevMonthUsers,
      currentMonthOrders,
      currentMonthUsers
    ] = await Promise.all([
      db.collection('pesanan').get(),
      db.collection('produk').get(),
      db.collection('pengguna').get(),
      getOrdersForMonth(previousMonth),
      getUsersForMonth(previousMonth),
      getOrdersForMonth(currentDate),
      getUsersForMonth(currentDate)
    ]);

    const [monthlySales, productCategories, monthlyUsers] = await Promise.all([
      getLastSixMonthsSales(),
      getProductCategories(),
      getLastSixMonthsUsers()
    ]);

    const metrics = {
      orderCount: ordersSnapshot.size,
      productCount: productsSnapshot.size,
      userCount: usersSnapshot.size,
      currentRevenue: currentMonthOrders.revenue,
      orderIncrease: calculateIncrease(prevMonthOrders.count, currentMonthOrders.count),
      userIncrease: calculateIncrease(prevMonthUsers.count, currentMonthUsers.count),
      revenueIncrease: calculateIncrease(prevMonthOrders.revenue, currentMonthOrders.revenue),
      averageOrderValue: currentMonthOrders.count > 0 
        ? (currentMonthOrders.revenue / currentMonthOrders.count).toFixed(2)
        : 0
    };

    const dashboardData = {
      metrics,
      charts: {
        monthlySales,
        productCategories,
        monthlyUsers
      },
      recentActivity: {
        recentOrders: currentMonthOrders.orders
          .sort((a, b) => new Date(b.order_date) - new Date(a.order_date))
          .slice(0, 5),
        newUsers: currentMonthUsers.users
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
      },
      popularProducts: productCategories.labels
        .map((label, index) => ({
          category: label,
          count: productCategories.data[index]
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
    };

    return new NextResponse(JSON.stringify(dashboardData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=60, stale-while-revalidate'
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Failed to fetch dashboard data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
      { status: 500 }
    );
  }
}

// Helper Functions
async function getOrdersForMonth(date) {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const snapshot = await db.collection('pesanan')
    .where('order_date', '>=', monthStart)
    .where('order_date', '<=', monthEnd)
    .get();

  let revenue = 0;
  const orders = [];

  snapshot.forEach(doc => {
    const orderData = doc.data();
    const order = {
      id: doc.id,
      ...orderData,
      order_date: orderData.order_date?.toDate?.() || orderData.order_date
    };
    orders.push(order);
    console.log('Order:', orderData);
    revenue += orderData.total || 0;
  });

  return {
    count: snapshot.size,
    revenue,
    orders
  };
}

async function getUsersForMonth(date) {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const snapshot = await db.collection('pengguna')
    .where('createdAt', '>=', monthStart)
    .where('createdAt', '<=', monthEnd)
    .get();

  const users = [];
  snapshot.forEach(doc => {
    const userData = doc.data();
    users.push({
      id: doc.id,
      ...userData,
      createdAt: userData.createdAt?.toDate?.() || userData.createdAt
    });
  });

  return {
    count: snapshot.size,
    users
  };
}

async function getLastSixMonthsSales() {
  const now = new Date();
  const months = [];
  const salesData = [];

  const promises = [];

  for (let i = 5; i >= 0; i--) {
    const date = subMonths(now, i);
    months.push(format(date, 'MMM'));
    promises.push(getOrdersForMonth(date));
  }

  const results = await Promise.all(promises);
  results.forEach(result => salesData.push(result.revenue));

  return {
    labels: months,
    data: salesData
  };
}

async function getLastSixMonthsUsers() {
  const now = new Date();
  const months = [];
  const usersData = [];

  const promises = [];

  for (let i = 5; i >= 0; i--) {
    const date = subMonths(now, i);
    months.push(format(date, 'MMM'));
    promises.push(getUsersForMonth(date));
  }

  const results = await Promise.all(promises);
  results.forEach(result => usersData.push(result.count));

  return {
    labels: months,
    data: usersData
  };
}

async function getProductCategories() {
  const snapshot = await db.collection('produk').get();
  const categoryMap = new Map();

  snapshot.forEach(doc => {
    const product = doc.data();
    console.log('Product:', product);
    const category = product.categoryName || 'Uncategorized';
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
  });

  const sortedCategories = [...categoryMap.entries()].sort((a, b) => b[1] - a[1]);

  return {
    labels: sortedCategories.map(([label]) => label),
    data: sortedCategories.map(([_, count]) => count)
  };
}

function calculateIncrease(prevValue, currentValue) {
  if (prevValue === 0) {
    return currentValue === 0 ? '0%' : '∞%';
  }

  const increase = ((currentValue - prevValue) / prevValue) * 100;
  return `${increase >= 0 ? '+' : ''}${Math.abs(increase).toFixed(1)}%`;
}
