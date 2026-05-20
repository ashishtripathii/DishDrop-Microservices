import axios from "axios";
import { useEffect, useState } from "react";
import { adminService } from "../config/config";
import type { IRestaurant, IRider } from "../types/types";
import AdminRestaurantCard from "../components/AdminRestaurantCard";
import AdminRiderCard from "../components/AdminRiderCard";

const Admin = () => {
  const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
  const [riders, setRiders] = useState<IRider[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"restaurant" | "rider">("restaurant");

  const fetchData = async () => {
    try {
      const { data } = await axios.get(
        `${adminService}/api/v1/admin/restaurant/pending`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const { data: response } = await axios.get(
        `${adminService}/api/v1/admin/rider/pending`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      setRestaurants(data.restaurants);
      setRiders(response.riders);
    } catch (error) {
      console.log(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };
    loadData();
  });

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center  ">
        <p className="text-gray-500">Loading admin panel... </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-6 space-y    ">
      <h1 className="text-2xl font-bold  ">Admin Dashboard</h1>

      <div className="flex gap-4">
        <button
          onClick={() => setTab("restaurant")}
          className={`px-4 py-2 rounded  ${tab === "restaurant" ? "bg-red-50 text-white " : "bg-gray-200 "} `}
        >
          Restaurant
        </button>

        <button
          onClick={() => setTab("rider")}
          className={`px-4 py-2 rounded  ${tab === "rider" ? "bg-red-500 text-white " : "bg-gray-200 "} `}
        >
          Rider
        </button>
      </div>

      {tab === "restaurant" && (
        <div className="grid grid-cols-1  sm:grid-cols-2 gap-4">
          {restaurants.length === 0 ? (
            <p>No pending Restaurants</p>
          ) : (
            restaurants.map((res) => (
              <AdminRestaurantCard
                key={res._id}
                restaurant={res}
                onVerify={fetchData}
              />
            ))
          )}
        </div>
      )}

      {tab === "rider" && (
        <div className="grid grid-cols-1  sm:grid-cols-2 gap-4">
          {riders.length === 0 ? (
            <p>No pending Riders</p>
          ) : (
            riders.map((rid) => (
              <AdminRiderCard key={rid._id} rider={rid} onVerify={fetchData} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;
