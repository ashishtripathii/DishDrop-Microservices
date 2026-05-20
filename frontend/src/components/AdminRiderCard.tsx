import axios from "axios";
import type { IRider } from "../types/types";
import { adminService } from "../config/config";
import toast from "react-hot-toast";

const AdminRiderCard = ({
  rider,
  onVerify,
}: {
  rider: IRider;
  onVerify: () => void;
}) => {
  const verify = async () => {
    try {
      await axios.patch(
        `${adminService}/api/v1/verify/rider/${rider._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success("rider verified");
      onVerify();
    } catch (error) {
      toast.error("failed to verify  restaurant", error);
    }
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow space-y-2">
      <img
        src={rider.picture}
        onError={(e) => (e.currentTarget.src = "/default-user.png")}
        className="h-40 w-full object-cover rounded"
        alt={`Rider ${rider.phoneNumber}`}
      />
      <h3>Mobile No: {rider.phoneNumber}</h3>
      <p className="text-sm text-gray-500">Aadhar No: {rider.aadharNumber}</p>
      <p className="text-sm text-gray-500">
        Driving License No: {rider.drivingLicenseNumber}
      </p>
      <p>Longitude: {rider?.location?.coordinates?.[0]}</p>
      <p>Latitude: {rider?.location?.coordinates?.[1]}</p>
      <button
        className="w-full rounded bg-green-500 py-2 text-white hover:bg-green-600"
        onClick={verify}
      >
        Verify Rider
      </button>
    </div>
  );
};

export default AdminRiderCard;
