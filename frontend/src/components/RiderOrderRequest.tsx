import axios from "axios";
import { useEffect, useState } from "react";
import { riderService } from "../config/config";
import toast from "react-hot-toast";

interface props {
  orderId: string;
  onAccepted: () => void;
}

const RiderOrderRequest = ({ orderId, onAccepted }: props) => {
  const [accepting, setAccepting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(10);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onAccepted();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onAccepted]);

  const acceptOrder = async () => {
    setAccepting(true);
    try {
      const { data } = await axios.post(
        `${riderService}/api/rider/accept/${orderId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success(data.message);
      onAccepted();
    } catch (error) {
      toast.error(error.response.data.message);
      onAccepted();
    } finally {
      setAccepting(false);
    }
  };
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm border border-green-300 space-y-3 ">
      <p className="text-center text-xs font-semibold text-red-600 ">
        Accept Within {secondsLeft}
      </p>

      <p className="text-center text-xs font-semibold text-green-600 ">
        New Delivery Request
      </p>

      <p className="text-gray-600 text-xs ">
        Order ID : <b>{orderId.slice(-6)}</b>
      </p>

      <button
        disabled={accepting}
        onClick={acceptOrder}
        className="w-full rounded-lg  bg-grren-600 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
      >
        {accepting ? "Accepting...." : "Accept Order"}
      </button>
    </div>
  );
};

export default RiderOrderRequest;
