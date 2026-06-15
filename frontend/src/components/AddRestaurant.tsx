import { useState } from "react";
import { useAppData } from "../context/useAppData";
import toast from "react-hot-toast";
import axios from "axios";
import { restaurantService } from "../config/config";
import { BiMapPin, BiUpload } from "react-icons/bi";

interface props {
  fetchMyRestaurant: () => Promise<void>;
}

const AddRestaurant = ({ fetchMyRestaurant }: props) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { loadingLocation, location } = useAppData();

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();

    if (!name || !image || !location) {
      toast.error("All fields are required");
      return;
    }

    const formData = new FormData();

    formData.append("name", name);
    formData.append("phone", phone); // Added the missing phone field
    formData.append("description", description);
    formData.append("latitude", String(location?.latitude));
    formData.append("longitude", String(location?.longitude));
    formData.append("formattedAddress", location.formattedAddress);
    formData.append("file", image);

    try {
      setSubmitting(true);
      const { data } = await axios.post(
        `${restaurantService}/api/restaurant/new`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            // Axios automatically sets the correct Content-Type for FormData
          },
        },
      );

      fetchMyRestaurant();
      toast.success("Restaurant added successfully", data?.restaurant?.name);

      // Optional: Clear form after successful submission
      setName("");
      setDescription("");
      setPhone("");
      setImage(null);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "An error occurred while submitting.",
        );
      } else {
        toast.error("An error occurred while submitting.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-lg rounded-xl bg-white p-6 shadow-sm">
        <h1 className="mb-5 text-xl font-semibold">Add your restaurant</h1>

        {/* Wrapped inputs in a form tag to handle the submit event properly */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Restaurant name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
          />

          <input
            type="tel" // 'tel' is generally better for phone numbers on mobile keyboards
            placeholder="Contact Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
          />

          <textarea
            placeholder="Restaurant Description...."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500 min-h-25"
          />

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm text-gray-600 hover:bg-gray-50">
            <BiUpload className="h-5 w-5 text-red-500" />
            <span className="truncate">
              {image ? image.name : "Upload Restaurant Image"}
            </span>
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setImage(e.target.files?.[0] || null)}
            />
          </label>

          <div className="flex items-start gap-3 rounded-lg border p-4">
            <BiMapPin className="mt-0.5 h-5 w-5 text-red-500" />
            <div className="text-sm ">
              {loadingLocation
                ? "Fetching your location ..."
                : location?.formattedAddress || "Location not available"}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || loadingLocation}
            className="w-full rounded-lg px-4 py-3 text-sm font-semibold bg-[#E23744] text-white transition-colors  disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? "Adding..." : "Add Restaurant"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddRestaurant;
