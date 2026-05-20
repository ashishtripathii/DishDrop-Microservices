import { useParams } from "react-router-dom";
import { useSocket } from "../context/useSocket";
import { useEffect, useState, useCallback } from "react";
import type { IOrder } from "../types/types";
import axios from "axios";
import { restaurantService } from "../config/config";
import UserOrderMap from "../components/UserOrderMap";

const OrderPage = () => {
  const { id } = useParams();
  const { socket } = useSocket();

  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [riderLocation, setRiderLocation] = useState<[number, number] | null>(
    null,
  );
  const fetchOrder = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`${restaurantService}/api/order/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      console.log(data.order);
      setOrder(data.order);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const loadOrder = async () => {
      await fetchOrder();
    };
    loadOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (!socket) return;

    const onOrderUpdate = () => {
      fetchOrder();
    };

    socket.on("order:update", onOrderUpdate);
    socket.on("order:rider_assigned", onOrderUpdate);
    return () => {
      socket.off("order:update", onOrderUpdate);
      socket.on("order:rider_assigned", onOrderUpdate);
    };
  }, [socket, fetchOrder]);

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit("join", `user:${id}`);
    return () => {
      socket.emit("leave", `user:${id}`);
    };
  }, [socket, id]);

  useEffect(() => {
    if (!socket) return;

    const onRiderLocation = ({
      latitude,
      longitude,
    }: {
      latitude: number;
      longitude: number;
    }) => {
      console.log("Rider location :", latitude, longitude);
      setRiderLocation([latitude, longitude]);
    };
    socket.on("rider:location", onRiderLocation);
    return () => {
      socket.off("rider:location", onRiderLocation);
    };
  }, [socket]);

  if (loading) {
    return <p className="text-center text-gray-500">Loading order...</p>;
  }

  if (!order) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center ">
        <p className="text-gray-500">No Order found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <h1 className="text-2xl font-semibold">Order #{order._id.slice(-6)}</h1>

      {/* Status */}
      <div className="rounded-xl border p-4">
        <p className="text-sm">
          Status :
          <span className="ml-2 capitalize font-medium">{order.status}</span>
        </p>
      </div>

      {/* Items */}
      <div className="space-y-4 rounded-xl border p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Items</h2>

        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{item.name}</p>

                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              </div>

              <p className="font-medium">₹ {item.price * item.quantity}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2 rounded-xl border p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Delivery Address</h2>

        <p className="text-sm text-gray-600">
          {order.deliveryAddress.formattedAddress}
        </p>

        <p className="text-sm text-gray-600">
          Mobile : {order.deliveryAddress.mobile}
        </p>
      </div>

      {/* Payment Summary */}
      <div className="space-y-4 rounded-xl border p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Payment Summary</h2>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>₹ {order.subtotal}</span>
          </div>

          <div className="flex items-center justify-between">
            <span>Delivery Fee</span>
            <span>₹ {order.deliveryFee}</span>
          </div>

          <div className="flex items-center justify-between">
            <span>Platform Fee</span>
            <span>₹ {order.platformFee}</span>
          </div>

          <div className="flex items-center justify-between border-t pt-3 text-base font-semibold">
            <span>Total</span>
            <span>₹ {order.totalAmount}</span>
          </div>
        </div>

        <div className="space-y-1 pt-2 text-sm text-gray-600">
          <p>
            Payment Method :
            <span className="ml-2 capitalize">{order.paymentMethod}</span>
          </p>

          <p>
            Payment Status :
            <span className="ml-2 capitalize">{order.paymentStatus}</span>
          </p>
        </div>
      </div>

      {(order.status === "rider_assigned" || order.status === "picked_up") &&
        (riderLocation ? (
          <div>
            <UserOrderMap
              riderLocation={riderLocation}
              deliveryLocation={[
                order.deliveryAddress.latitude!,
                order.deliveryAddress.longitude!,
              ]}
            />
          </div>
        ) : (
          <p>Waiting for rider location</p>
        ))}
    </div>
  );
};

export default OrderPage;
