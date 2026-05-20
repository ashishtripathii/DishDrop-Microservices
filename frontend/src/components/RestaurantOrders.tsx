import { useCallback, useEffect, useRef, useState } from "react";
import type { IOrder } from "../types/types";
import { useSocket } from "../context/useSocket";
import axios from "axios";
import { restaurantService } from "../config/config";

// Local audio file
import notificationAudio from "../assets/zomatoring_alert.mp3";
import OrderCard from "./OrderCard";

const ACTIVE_STATUSES = [
  "placed",
  "accepted",
  "preparing",
  "ready_for_rider",
  "rider_assigned",
  "picked_up",
];

const RestaurantOrders = ({ restaurantId }: { restaurantId: string }) => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const { socket } = useSocket();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // =========================
  // Initialize Audio
  // =========================

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(
        `${restaurantService}/api/order/restaurant/${restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setOrders(data.orders || []);

      console.log("📦 Orders updated:", data.orders?.length);
    } catch (error) {
      console.log("❌ Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    const audio = new Audio(notificationAudio);
    audio.preload = "auto";
    audio.volume = 1;
    audioRef.current = audio;
    console.log("🎵 Audio initialized:", audio.src);
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onUpdateOrder = () => {
      fetchOrders();
    };
    socket.on("order:rider_assigned", onUpdateOrder);
    return () => {
      socket.off("order:rider_assigned", onUpdateOrder);
    };
  }, [socket, fetchOrders]);

  // =========================
  // Unlock Browser Audio
  // =========================
  const unlockAudio = async () => {
    if (!audioRef.current) return;
    try {
      audioRef.current.volume = 1;
      await audioRef.current.play();
      console.log("🔊 Audio unlocked");
      setAudioUnlocked(true);
      // Pause AFTER unlock
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }, 300);
    } catch (err) {
      console.log("❌ Failed to unlock audio", err);
    }
  };

  // =========================
  // Fetch Orders
  // =========================

  // =========================
  // Initial Fetch
  // =========================
  useEffect(() => {
    const loadData = async () => {
      await fetchOrders();
    };
    loadData();
  }, [fetchOrders]);

  // =========================
  // Join Restaurant Room
  // =========================
  useEffect(() => {
    if (!socket || !restaurantId) return;

    const room = `restaurant:${restaurantId}`;

    socket.emit("join-room", room);

    console.log("✅ Joined room:", room);

    return () => {
      socket.emit("leave-room", room);

      console.log("❌ Left room:", room);
    };
  }, [socket, restaurantId]);

  // =========================
  // Listen For New Orders
  // =========================
  useEffect(() => {
    if (!socket) return;

    const onNewOrder = async (payload: { orderId: string }) => {
      console.log("🛎️ New order received:", payload);

      console.log("audioUnlocked:", audioUnlocked);

      // Play notification sound
      if (audioUnlocked && audioRef.current) {
        try {
          audioRef.current.currentTime = 0;

          audioRef.current.volume = 1;

          await audioRef.current.play();

          console.log("🔊 Notification sound played");
        } catch (err) {
          console.error("❌ Audio play failed", err);
        }
      }

      // Refresh orders in realtime
      await fetchOrders();
    };

    socket.on("order:new", onNewOrder);

    console.log("👂 Listening for order:new");

    return () => {
      console.log("🧹 Removing order:new listener");

      socket.off("order:new", onNewOrder);
    };
  }, [socket, audioUnlocked, fetchOrders]);

  // =========================
  // Loading State
  // =========================
  if (loading) {
    return <p className="text-gray-500">Loading Orders...</p>;
  }

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const completeOrders = orders.filter(
    (o) => !ACTIVE_STATUSES.includes(o.status),
  );

  return (
    <div className="space-y-6">
      {/* =========================
          Enable Sound
      ========================= */}
      {!audioUnlocked && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>

            <div>
              <p className="font-medium text-blue-900">
                Enable Sound Notifications
              </p>

              <p className="text-sm text-blue-700">
                Get notified when new orders arrive
              </p>
            </div>
          </div>

          <button
            onClick={unlockAudio}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
          >
            Enable Sound
          </button>
        </div>
      )}

      {/* =========================
          Active Orders
      ========================= */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Active Orders</h3>

        {activeOrders.length === 0 ? (
          <p className="text-sm text-gray-500">No Active Orders</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {activeOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onStatusUpdate={fetchOrders}
              />
            ))}
          </div>
        )}
      </div>

      {/* =========================
          Completed Orders
      ========================= */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Completed Orders</h3>

        {completeOrders.length === 0 ? (
          <p className="text-sm text-gray-500">No Completed Orders</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {completeOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onStatusUpdate={fetchOrders}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantOrders;
