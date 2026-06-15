import { useEffect, useRef, useState } from "react";
import { useAppData } from "../context/useAppData";
import { useSocket } from "../context/useSocket";
import axios from "axios";
import { riderService } from "../config/config";
import toast from "react-hot-toast";
import { BiUpload } from "react-icons/bi";
import type { IOrder } from "../types/types";
import notificationAudio from "../assets/sony_ringtone.mp3";
import RiderOrderRequest from "../components/RiderOrderRequest";
import RiderCurrentOrder from "../components/RiderCurrentOrder";
import RiderOrderMap from "../components/RiderOrderMap";

interface IRider {
  _id: string;
  picture: string;
  phoneNumber: string;
  aadharNumber: string;
  drivingLicenseNumber: string;
  isVerified: boolean;
  isAvailable: boolean;
}

const RiderDashBoard = () => {
  const { user } = useAppData();
  const { socket } = useSocket();
  const [profile, setProfile] = useState<IRider | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [incomingOrders, setIncomingOrders] = useState<string[]>([]);
  const [currentOrder, setCurrentOrder] = useState<IOrder | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(`${riderService}/api/rider/myProfile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setProfile(data || null);
    } catch (error) {
      console.log(error);

      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (user?.role === "rider") {
        await fetchProfile();
      } else {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

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

      toast.success("Sound Enabled");
    } catch (err) {
      console.log("❌ Failed to unlock audio", err);
      toast.error("Tap again to enable sound");
    }
  };

  useEffect(() => {
    if (!socket) return;

    const onOrderAvailable = ({ orderId }: { orderId: string }) => {
      setIncomingOrders((prev) =>
        prev.includes(orderId) ? prev : [...prev, orderId],
      );

      if (audioUnlocked && audioRef.current) {
        audioRef.current.currentTime = 0;

        audioRef.current.play().catch(() => {});

        setTimeout(() => {
          setIncomingOrders((prev) => prev.filter((id) => id !== orderId));
        }, 10000);
      }
    };

    socket.on("order:available", onOrderAvailable);

    return () => {
      socket.off("order:available", onOrderAvailable);
    };
  }, [socket, audioUnlocked]);

  const fetchCurrentOrders = async () => {
    try {
      const { data } = await axios.get(
        `${riderService}/api/rider/order/current`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setCurrentOrder(data.order);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || error.message);
      } else {
        toast.error("Something went wrong");
      }
      setCurrentOrder(null);
    }
  };

  useEffect(() => {
    const loadCurrentOrders = async () => {
      await fetchCurrentOrders();
    };

    loadCurrentOrders();
  }, []);

  const toggleAvailability = async () => {
    if (!navigator.geolocation) {
      toast.error("Location accessed required");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await axios.patch(
          `${riderService}/api/rider/toggle`,
          {
            isAvailable: !profile?.isAvailable,
            longitude: pos.coords.longitude,
            latitude: pos.coords.latitude,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        toast.success(
          profile?.isAvailable ? "You are offline" : "You are online",
        );
        fetchProfile();
      } catch (error) {
        if (axios.isAxiosError(error)) {
          toast.error(error.response?.data?.message || error.message);
        } else {
          toast.error("Something went wrong");
        }
      } finally {
        setToggling(false);
      }
    });
  };

  const handleSubmit = async () => {
    try {
      if (!navigator.geolocation) {
        toast.error("Location accessed required");
        return;
      }

      setLoading(true);
      setSubmitting(true);
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const formData = new FormData();

        formData.append("phoneNumber", phoneNumber);
        formData.append("aadharNumber", aadharNumber);
        formData.append("drivingLicenseNumber", drivingLicenseNumber);
        if (image) {
          formData.append("file", image);
        }

        formData.append("latitude", pos.coords.latitude.toString());
        formData.append("longitude", pos.coords.longitude.toString());
        try {
          const { data } = await axios.post(
            `${riderService}/api/rider/new`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          );
          toast.success(data.message || "");
          fetchProfile();
        } catch (error) {
          if (axios.isAxiosError(error)) {
            toast.error(error.response?.data?.message || error.message);
          } else {
            toast.error("Something went wrong");
          }
        } finally {
          setLoading(false);
          setSubmitting(false);
        }
      });
    } catch (error) {
      console.log(error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || error.message);
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  if (user?.role !== "rider") {
    return (
      <div className="flex min-h-[60vh]  items-center justify-center text-gray-500">
        You are not registred as Rider
      </div>
    );
  }

  if (loading) {
    return (
      <div className=" flex min-h-[60vh]  items-center justify-center text-gray-500">
        Loading Rider details...
      </div>
    );
  }

  if (!profile)
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-lg rounded-xl bg-white p-6 shadow-sm">
          <h1 className="mb-5 text-xl font-semibold">Add your Profile </h1>

          {/* Wrapped inputs in a form tag to handle the submit event properly */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="text"
              placeholder="AadharNumber......."
              value={aadharNumber}
              onChange={(e) => setAadharNumber(e.target.value)}
              className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
            />

            <input
              type="tel" // 'tel' is generally better for phone numbers on mobile keyboards
              placeholder="Contact Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
            />

            <input
              type="text"
              placeholder="Driving Liciense......."
              value={drivingLicenseNumber}
              onChange={(e) => setDrivingLicenseNumber(e.target.value)}
              className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
            />

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm text-gray-600 hover:bg-gray-50">
              <BiUpload className="h-5 w-5 text-red-500" />
              <span className="truncate">
                {image ? image.name : "Upload your Image"}
              </span>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg px-4 py-3 text-sm font-semibold bg-[#E23744] text-white transition-colors  disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? "Adding..." : "Add Profile"}
            </button>
          </form>
        </div>
      </div>
    );

  return (
    <div className="space-y-4 ">
      <div className="mx-auto max-w-md px-4 py-4">
        <div className="rounded-xl bg-white p-4 shadow  space-y-3">
          <img
            src={profile.picture}
            className="mx-auto  h-24 w-24 rounded-full object-cover"
            alt=""
          />
          <p className="text-center font-semibold">{user?.name}</p>
          <p className="text-center  text-xs text-gray-500">
            {profile.phoneNumber}
          </p>

          <div className="flex justify-center gap-2 ">
            <span className="px-3 py-1 text-xs  rounded-full bg-green-100 text-green-600  ">
              {profile.isVerified ? "Verified" : "Pending"}
            </span>

            <span className="px-3 py-1 text-xs  rounded-full bg-green-100 text-green-600  ">
              {profile.isAvailable ? "Online" : "Offline"}
            </span>
          </div>
          <div>
            <p className="text-blue-400 ">
              Please be within a 500 m of radius of any restaurant (which we can
              call a hostspot) before going online as a rider to recieve orders.
            </p>
          </div>
          {profile.isVerified && !currentOrder && (
            <button
              className={`w-full py-2 rounded-lg text-white font-semibold ${toggling ? "bg-gray-400" : profile.isAvailable ? "bg-gray-600" : "bg-[#e23774]"}`}
              onClick={toggleAvailability}
              disabled={toggling}
            >
              $
              {toggling
                ? "Updating...."
                : profile.isAvailable
                  ? "Go Offline"
                  : "Go Online"}
            </button>
          )}
        </div>
      </div>

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
      {profile.isAvailable && incomingOrders.length > 0 && (
        <div className="mx-auto max-w-md px-4 space-y-3 ">
          <h3 className="font-semibold text-gray-700">Incoming Orders</h3>
          {incomingOrders.map((id) => (
            <RiderOrderRequest
              key={id}
              orderId={id}
              onAccepted={() => {
                fetchProfile();
                fetchCurrentOrders();
              }}
            />
          ))}
        </div>
      )}

      {currentOrder && (
        <div className="mx-auto max-w-md px-4 space-y-4 ">
          <RiderCurrentOrder
            order={currentOrder}
            onStatusUpdate={fetchCurrentOrders}
          />

          <RiderOrderMap order={currentOrder} />
        </div>
      )}
    </div>
  );
};

export default RiderDashBoard;
