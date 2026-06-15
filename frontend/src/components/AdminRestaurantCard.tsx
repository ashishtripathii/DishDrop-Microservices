import axios from "axios";
import type { IRestaurant } from "../types/types";
import { adminService } from "../config/config";
import toast from "react-hot-toast";

const AdminRestaurantCard = ({
  restaurant,
  onVerify,
}: {
  restaurant: IRestaurant;
  onVerify: () => void;
}) => {
  const verify = async () => {
    try {
      await axios.patch(
        `${adminService}/api/v1/verify/restaurant/${restaurant._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success("Restaurant verified");
      onVerify();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.response?.data?.message);
    }
  };

  return (
    <div className="rounded-xl bg-white  p-4 shadow space-y-2   ">
      <img
        src={restaurant.image}
        className="h-40 w-full object-cover rounded"
        alt=""
      />
      <h3>{restaurant.name}</h3>
      <p className="text-sm text-gray-500 ">{restaurant.phone}</p>
      <p>{restaurant.autoLocation?.formattedAddress}</p>
      <button
        className="w-full  rounded bg-green-500 py-2 text-white  hover:bg-gray-600 "
        onClick={verify}
      >
        Verify Restaurant
      </button>
    </div>
  );
};

export default AdminRestaurantCard;
