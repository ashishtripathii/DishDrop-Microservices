import axios from "axios";
import React, { useState } from "react";
import { restaurantService } from "../config/config";
import toast from "react-hot-toast";
import { BiUpload } from "react-icons/bi";

const AddMenuItem = ({ onItemAdded }: { onItemAdded: () => void }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setImage(null);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name || !price || !image || !description) {
      toast.error("All fields are required");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("file", image);
    formData.append("price", price);

    try {
      setLoading(true);

      const { data } = await axios.post(
        `${restaurantService}/api/item/new`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // ✅ fixed
          },
        },
      );

      toast.success(data.message || "Item Added successfully");
      resetForm();
      onItemAdded();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message || "Failed to add Item";

        toast.error(msg);
      } else {
        toast.error("Failed to add Item");
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md sapce-y-4 m-auto flex flex-col gap-1 "
    >
      <h2 className="text-lg font-semibold">Add Menu Item</h2>
      <input
        type="text"
        placeholder="Item name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg border px-4 py-2 text-sm outline-none"
      />

      <textarea
        placeholder="Item description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded-lg border px-4 py-2 text-sm outline-none"
      />

      <input
        type="number"
        placeholder="price  ₹ "
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full rounded-lg border px-4 py-2 text-sm outline-none"
      />

      <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm text-gray-600 hover:bg-gray-50">
        <BiUpload className="h-5 w-5 text-red-500" />
        <span className="truncate">
          {image ? image.name : "Upload Menu Item Image"}
        </span>
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => setImage(e.target.files?.[0] || null)}
        />
      </label>

      <button
        className="w-full rounded-lg text-white text-sm py-3 font-semibold transition  bg-red-500 cursor-pointer "
        disabled={loading}
      >
        {loading ? "Adding..." : "Add Item "}
      </button>
    </form>
  );
};

export default AddMenuItem;
