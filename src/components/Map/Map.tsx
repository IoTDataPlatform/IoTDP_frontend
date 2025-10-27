import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L, { type LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./Map.css";
import type { Stop, Vehicle } from "./Map.types";

const mockStops: Stop[] = [
  { id: "stop1", name: "Центральный вокзал", position: [59.93, 30.362] },
  { id: "stop2", name: "Парк Культуры", position: [59.935, 30.35] },
  { id: "stop3", name: "Технологический институт", position: [59.917, 30.322] },
];

const mockVehicles: Vehicle[] = [
  { id: "bus-5A-1", position: [59.932, 30.355], route: "5A", status: "onTime" },
  { id: "bus-5A-2", position: [59.925, 30.34], route: "5A", status: "delayed" },
  { id: "bus-12-1", position: [59.92, 30.33], route: "12", status: "critical" },
];

const route5A_path: LatLngExpression[] = [
  [59.93, 30.362],
  [59.935, 30.35],
  [59.925, 30.34],
];

const route12_path: LatLngExpression[] = [
  [59.93, 30.362],
  [59.92, 30.33],
  [59.917, 30.322],
];

const getVehicleIcon = (status: Vehicle["status"]) => {
  const colorMap = {
    onTime: "bg-blue",
    delayed: "bg-orange",
    critical: "bg-red",
  };
  const colorClass = colorMap[status];

  return L.divIcon({
    className: `vehicle-icon ${colorClass}`,
    html: `🚌`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const Map: React.FC = () => {
  const mapCenter: LatLngExpression = [59.93428, 30.335098]; // Центр Санкт-Петербурга

  return (
    <MapContainer
      center={mapCenter}
      zoom={14}
      style={{ height: "80vh", width: "80vw" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Polyline
        pathOptions={{ color: "blue", weight: 3 }}
        positions={route5A_path}
      />
      <Polyline
        pathOptions={{ color: "orange", weight: 3 }}
        positions={route12_path}
      />

      {mockStops.map((stop) => (
        <Marker key={stop.id} position={stop.position}>
          <Popup>
            <b>Остановка:</b> {stop.name}
          </Popup>
        </Marker>
      ))}

      {mockVehicles.map((vehicle) => (
        <Marker
          key={vehicle.id}
          position={vehicle.position}
          icon={getVehicleIcon(vehicle.status)}
        >
          <Popup>
            <b>ID:</b> {vehicle.id} <br />
            <b>Маршрут:</b> {vehicle.route} <br />
            <b>Статус:</b> {vehicle.status}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Map;
