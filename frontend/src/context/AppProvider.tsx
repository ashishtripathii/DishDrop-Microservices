import { useEffect, useState, type ReactNode } from "react";
import { authService, restaurantService } from "../config/config";
import axios from "axios";
import { AppContext } from "./AppContext";
import type { ICart, ILocationData, IUser } from "../types/types";
import toast from "react-hot-toast";

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const [location, setLocation] = useState<ILocationData | null>(null);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(true);
  const [city, setCity] = useState<string>("Fetching Location...");

  const [cart, setCart] = useState<ICart[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [quantity, setQuantity] = useState(0);
  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setIsAuth(false);
          return;
        }

        const { data } = await axios.get(`${authService}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(data.user);
        setIsAuth(true);
      } catch (error) {
        console.log(error);
        setUser(null);
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const fetchCart = async () => {
    const token = localStorage.getItem("token");
    try {
      const { data } = await axios.get(`${restaurantService}/api/cart/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("CART RESPONSE:", data);
      setCart(data.cart || []);
      setSubTotal(data.subtotal || 0);
      setQuantity(data.cartLength || 0);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (user && user.role === "customer") fetchCart();
  }, [user]);

  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error("Please allow location to continue");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );

          const data = await response.json();

          setLocation({
            latitude,
            longitude,
            formattedAddress: data.display_name || "current_location",
          });

          setCity(
            data.address.city ||
              data.address.town ||
              data.address.village ||
              "Your location",
          );
        } catch (error) {
          setLocation({
            latitude,
            longitude,
            formattedAddress: "Current_location",
          });
          setCity("Failed to load");
          console.log(error);
        } finally {
          setLoadingLocation(false); // ✅ correct place
        }
      },
      (error) => {
        console.error(error);
        setLoadingLocation(false);
        toast.error("Location permission denied");
      },
    );
  }, []);

  return (
    <AppContext.Provider
      value={{
        isAuth,
        loading,
        setIsAuth,
        setLoading,
        setUser,
        user,
        location,
        city,
        loadingLocation,
        cart,
        fetchCart,
        subTotal,
        quantity,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
