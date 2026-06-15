import { useState } from "react";
import type { IMenuItem } from "../types/types";
import { FiEyeOff } from "react-icons/fi";
import { BiTrash } from "react-icons/bi";
import { BsCartPlus, BsEye } from "react-icons/bs";
import { VscLoading } from "react-icons/vsc";
import axios from "axios";
import { restaurantService } from "../config/config";
import toast from "react-hot-toast";
import { useAppData } from "../context/useAppData";

interface MenuItemsProps {
  items: IMenuItem[];
  onItemDeleted: () => void;
  isSeller: boolean;
}

const MenuItems = ({ items, onItemDeleted, isSeller }: MenuItemsProps) => {
  const { fetchCart } = useAppData();
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

  const handleDelete = async (Id: string) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this item.",
    );

    if (!confirm) return;
    try {
      await axios.delete(`${restaurantService}/api/item/${Id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast.success("Item deleted");
      onItemDeleted();
    } catch (error) {
      console.log(error);
      toast.error("failed to delete item  ");
    }
  };

  const toggleAvailiblity = async (Id: string) => {
    try {
      const { data } = await axios.put(
        `${restaurantService}/api/item/status/${Id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success(data.message || "Item not available");
      onItemDeleted();
    } catch (error) {
      console.log(error);
      toast.error("failed to delete item  ");
    }
  };

  const addToCart = async (restaurantId: string, itemId: string) => {
    try {
      setLoadingItemId(itemId);
      const { data } = await axios.post(
        `${restaurantService}/api/cart/add`,
        {
          restaurantId,
          itemId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success(data.message || "Item added successfully");
      await fetchCart();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setLoadingItemId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {items?.map((item) => {
        const isLoading = loadingItemId === item?._id;

        return (
          <div
            key={item._id} // ✅ IMPORTANT
            className={`relative flex gap-4 rounded-lg bg-white p-4 shadow-sm transition
        ${!item.isAvaliable ? "opacity-70" : ""}`}
          >
            {/* Image */}
            <div className="relative shrink-0">
              <img
                src={item.image}
                alt={item.name}
                className={`h-20 w-20 rounded object-cover ${
                  !item.isAvaliable ? "grayscale brightness-75" : ""
                }`}
              />
              {!item.isAvaliable && (
                <span className="absolute inset-0 flex justify-center items-center rounded bg-black/60 text-xs font-semibold text-white ">
                  Not Available
                </span>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-green-600">
                  ₹{item.price}
                </p>

                {isSeller && (
                  <div className="flex gap-2 ">
                    <button
                      onClick={() => toggleAvailiblity(item._id)}
                      className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 "
                    >
                      {item.isAvaliable ? (
                        <BsEye size={18} />
                      ) : (
                        <FiEyeOff size={18} />
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(item._id)}
                      className="runded-lg p-2 text-red-500 hover:bg-red-50"
                    >
                      <BiTrash size={18} />
                    </button>
                  </div>
                )}

                {!isSeller && (
                  <button
                    disabled={!item.isAvaliable || isLoading}
                    onClick={() => addToCart(item.restaurantId, item._id)}
                    className={`flex items-center justify-center rounded-lg p-2 ${!item.isAvaliable || isLoading ? "cursor-not-allowed text-gray-400" : "text-red-500 hover:bg-red-50"}`}
                  >
                    {isLoading ? (
                      <VscLoading size={18} className="animate-spin" />
                    ) : (
                      <BsCartPlus size={18} className="" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MenuItems;
