import { useEffect, useState } from "react";
import axios from "axios";

const BannerTable = ({ onEdit, onDelete }) => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data } = await axios.get('/api/v1/banners');
        setBanners(data);
      } catch (error) {
        console.error('Error fetching banners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  if (loading) {
    return <div className="text-center py-[2vw]">Loading banners...</div>;
  }

  if (banners.length === 0) {
    return <div className="text-center py-[2vw]">No banners found</div>;
  }

  return (
    <div className="mt-[2vw]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-[1vw] py-[1vh] text-left text-[1vw] font-medium text-gray-500">Preview</th>
              <th className="px-[1vw] py-[1vh] text-left text-[1vw] font-medium text-gray-500">Title</th>
              <th className="px-[1vw] py-[1vh] text-left text-[1vw] font-medium text-gray-500">Status</th>
              <th className="px-[1vw] py-[1vh] text-left text-[1vw] font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {banners.map((banner) => (
              <tr key={banner.id}>
                <td className="px-[1vw] py-[1vh]">
                  <img 
                    src={banner.imageUrl} 
                    alt={banner.title} 
                    className="w-[10vw] h-[4vw] object-cover rounded-[0.5vw]"
                  />
                </td>
                <td className="px-[1vw] py-[1vh] text-[1vw]">{banner.title}</td>
                <td className="px-[1vw] py-[1vh]">
                  <span className={`px-[0.8vw] py-[0.3vh] rounded-full text-[0.8vw] ${
                    banner.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-[1vw] py-[1vh] text-[1vw]">
                  <button
                    onClick={() => onEdit(banner)}
                    className="text-[#00C7BE] hover:text-[#00a69e] mr-[1vw]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(banner.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BannerTable;