"use client";
import Image from "next/image";
import searchIcon from "../assett/searchIcon.png";
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import ProdukTable from "@/components/ProdukTable";
import { useState, useEffect } from "react";
import axios from "axios";

ChartJS.register(
  LineElement,
  BarElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
);

const Card = ({ title, count, increase, color }) => {
  return (
    <div
      className={`${color} px-[2vw] py-[3vh] rounded-[2vw] flex flex-col gap-[1vh] w-[20vw] text-white`}
    >
      <h1 className="text-[1vw]">{title}</h1>
      <div className="flex flex-row gap-[6vw] items-center">
        <h1 className="text-[3vw]">{count}</h1>
        {increase && <p className="text-[2vw]">{increase}</p>}
      </div>
    </div>
  );
};

const BodyDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get("/api/v1/dashboard");
        setDashboardData(response.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  if (!dashboardData) {
    return <div className="text-center py-4">No dashboard data available</div>;
  }

  // Line chart data
  const lineChartData = {
    labels: dashboardData.charts?.monthlySales?.labels || [],
    datasets: [
      {
        label: "Sales 2025 (in Rp)",
        data: dashboardData.charts?.monthlySales?.data || [],
        fill: false,
        backgroundColor: "rgba(75,192,192,0.4)",
        borderColor: "rgba(75,192,192,1)",
        tension: 0.1,
      },
    ],
  };

  // Bar chart data
  const barChartData = {
    labels: dashboardData.charts?.productCategories?.labels || [],
    datasets: [
      {
        label: "Products by Category",
        data: dashboardData.charts?.productCategories?.data || [],
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const formatToK = (value) => {
    const number = Number(value);
    return number >= 1000 ? `${Math.round(number / 1000)}k` : number.toString();
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Monthly Sales Data (2025)",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="mt-[3vh] px-[1vw] flex flex-col gap-[2vh]">
      <div className="flex flex-row gap-[0.5vw] items-center bg-[#EBEBEC] p-[1vw] rounded-[1vw]">
        <Image src={searchIcon} alt="search icon" className="w-4 h-4" />
        <input
          type="text"
          placeholder="Search"
          className="w-[30vw] h-[3vh] outline-none text-[1vw]"
        />
      </div>
      <div className="flex flex-row gap-[2vw]">
        <Card
          title={"Jumlah Order"}
          count={dashboardData.metrics.orderCount}
          increase={dashboardData.metrics.orderIncrease}
          color={"bg-blue-400"}
        />
        <Card
          title={"Jumlah Produk"}
          count={dashboardData.metrics.productCount}
          color={"bg-black opacity-80"}
        />
        <Card
          title={"Pengguna Baru"}
          count={dashboardData.metrics.userCount}
          increase={dashboardData.metrics.userIncrease}
          color={"bg-blue-400"}
        />
        <Card
          title={"Rata-rata Nilai Order"}
          count={`${formatToK(dashboardData.metrics.averageOrderValue)}`}

          increase={dashboardData.metrics.revenueIncrease}
          color={"bg-black opacity-80"}
        />
      </div>
      <div className="bg-white p-[2vw] rounded-[2vw]">
        <Line data={lineChartData} options={chartOptions} />
      </div>

      <div className="flex flex-row gap-4 w-full">
        <div className="bg-white flex-1 p-4 rounded-xl w-1/2">
          <Bar data={barChartData} options={chartOptions} />
        </div>
        <div className="bg-white flex-1 p-4 rounded-xl w-1/2">
          <Bar data={barChartData} options={chartOptions} />
        </div>
      </div>

      <div className="bg-white rounded-[2vw] p-[2vw]">
        <h1 className="text-[#00C7BE] text-[1.5vw]">Produk</h1>
        <ProdukTable />
      </div>
    </div>
  );
};

export default BodyDashboard;
