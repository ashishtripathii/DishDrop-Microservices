import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { IMenuItem, IRestaurant } from "../types/types";
import axios from "axios";
import { restaurantService } from "../config/config";
import toast from "react-hot-toast";
import RestaurantProfile from "../components/RestaurantProfile";
import MenuItems from "../components/MenuItems";

const RestaurantUserPage = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRestaurant = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/restaurant/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setRestaurant(data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/item/all/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setMenuItems(data.items ?? null);
      console.log(data.items);
    } catch (error) {
      if (error instanceof Error) {
        console.log(error.message);
        toast.error(error.message);
      } else {
        console.log("Unknown error");
        toast.error("Something went wrong");
      }
    }
  };

  useEffect(() => {
    if (id) {
      fetchMenuItems();
      fetchRestaurant();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex  h-[60vh] items-center justify-center">
        <p className="text-gray-500"> Loading restaurant....</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex  h-[60vh] items-center justify-center">
        <p className="text-gray-500">No restaurant with this Id.</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 py-6 space-y-6  ">
      <RestaurantProfile
        restaurant={restaurant}
        onUpdate={setRestaurant}
        isSeller={false}
      />

      <div className="rounded-xl bg-white shadow-sm p-4">
        <MenuItems
          isSeller={false}
          items={menuItems}
          onItemDeleted={() => {}}
        />
      </div>
    </div>
  );
};

export default RestaurantUserPage;
