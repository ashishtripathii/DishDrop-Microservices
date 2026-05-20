import type { IOrder } from "../types/types";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import axios from "axios";
import { realtimeService } from "../config/config";

const riderIcon = new L.DivIcon({
  html: "🛵",
  iconSize: [30, 30],
  className: "",
});

const deliveryIcon = new L.DivIcon({
  html: "🏠",
  iconSize: [30, 30],
  className: "",
});

const Routing = ({
  from,
  to,
}: {
  from: [number, number];
  to: [number, number];
}) => {
  const map = useMap();

  useEffect(() => {
    const control = L.Routing.control({
      waypoints: [L.latLng(from), L.latLng(to)],

      lineOptions: {
        styles: [{ color: "#E23744", weight: 5 }],
      },

      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false,

      createMarker: () => null,

      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
      }),
    }).addTo(map);

    return () => {
      map.removeControl(control);
    };
  }, [from, to, map]);

  return null;
};

interface props {
  order: IOrder;
}

const RiderOrderMap = ({ order }: props) => {
  const [riderLocation, setRiderLocation] = useState<[number, number] | null>(
    null,
  );

  useEffect(() => {
    const fetchRiderLocation = async () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latitude = pos.coords.latitude;
          const longitude = pos.coords.longitude;

          setRiderLocation([latitude, longitude]);

          axios.post(
            `${realtimeService}/api/v1/internal/emit`,
            {
              event: "rider:location",
              room: `user:${order.userId}`,
              payload: { latitude, longitude },
            },
            {
              headers: {
                "x-internal-key": import.meta.env.VITE_INTERNAL_SERVICE_KEY,
              },
            },
          );
        },
        (error) => console.log("Location Error :", error),
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000,
        },
      );
    };

    fetchRiderLocation();

    const interval = setInterval(fetchRiderLocation, 10000);

    return () => clearInterval(interval);
  }, [order.userId]);

  if (
    order.deliveryAddress.latitude === null ||
    order.deliveryAddress.longitude === null
  ) {
    return null;
  }
  const deliveryLocation: [number, number] = [
    order.deliveryAddress.latitude,
    order.deliveryAddress.longitude,
  ];

  if (!riderLocation) {
    return <p>Loading map...</p>;
  }

  return (
    <div className="rounded-xl bg-white shadow-sm p-3">
      <MapContainer
        center={deliveryLocation}
        zoom={14}
        scrollWheelZoom={true}
        className="h-87.5 w-ful rounded-lgl"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={riderLocation} icon={riderIcon}>
          <Popup>Rider Location</Popup>
        </Marker>

        <Marker position={deliveryLocation} icon={deliveryIcon}>
          <Popup>Delivery Location</Popup>
        </Marker>

        <Routing from={riderLocation} to={deliveryLocation} />
      </MapContainer>
    </div>
  );
};

export default RiderOrderMap;
