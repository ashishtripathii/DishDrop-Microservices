import { useEffect, useState } from "react";
import type { IMenuItem, IRestaurant } from "../types/types";
import axios from "axios";
import { restaurantService } from "../config/config";
import AddRestaurant from "../components/AddRestaurant";
import RestaurantProfile from "../components/RestaurantProfile";
import MenuItems from "../components/MenuItems";
import AddMenuItem from "../components/AddMenuItem";
import toast from "react-hot-toast";
import RestaurantOrders from "../components/RestaurantOrders";
type SellerTab = "menu" | "add-item" | "sales";

const Restaurant = () => {
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, seTab] = useState<SellerTab>("menu");
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);

  const fetchMyRestaurant = async () => {
    console.log("STEP 1: function entered");

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const { data } = await axios.get(
        `${restaurantService}/api/restaurant/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setRestaurant(data.restaurant);

      if (data.token) {
        localStorage.setItem("token", data.token);
        window.location.reload();
      }
    } catch (error) {
      console.log("STEP ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async (restaurantId: string) => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/item/all/${restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setMenuItems(data?.items);
      console.log(data.items);
    } catch (error) {
      console.log(error.message);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    const loadRestaurantData = async () => {
      await fetchMyRestaurant();
    };
    loadRestaurantData();
  }, []);

  useEffect(() => {
    const loadMenuItems = async () => {
      if (restaurant?._id) await fetchMenuItems(restaurant._id);
    };
    loadMenuItems();
  }, [restaurant]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading your restaurant....</p>
      </div>
    );
  }

  if (!restaurant) {
    return <AddRestaurant fetchMyRestaurant={fetchMyRestaurant} />;
  }
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 space-y-6 ">
      <RestaurantProfile
        restaurant={restaurant}
        onUpdate={setRestaurant}
        isSeller={true}
      />

      <RestaurantOrders restaurantId={restaurant._id} />

      <div className="rounded-xl bg-white shadow-sm ">
        <div className="flex border-b ">
          {[
            { key: "menu", label: "Menu Items" },
            { key: "add-item", label: "Add Item" },
            { key: "sales", label: "Sales" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => seTab(t.key as SellerTab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition 
                ${t.key === tab ? "border-b-2 border-red-500 text-red " : "text-gray-500 hover:text-gray-700 "} `}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "menu" && (
            <div>
              <MenuItems
                items={menuItems}
                onItemDeleted={() => fetchMenuItems(restaurant?._id)}
                isSeller={true}
              />
            </div>
          )}
          {tab === "add-item" && (
            <div>
              <AddMenuItem
                onItemAdded={() => fetchMenuItems(restaurant?._id)}
              />
            </div>
          )}
          {tab === "sales" && <div>Sales Page</div>}
        </div>
      </div>
    </div>
  );
};

export default Restaurant;
