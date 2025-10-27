import type { LatLngExpression } from "leaflet";

export type Stop = {
  id: string;
  name: string;
  position: LatLngExpression;
}

export type Vehicle = {
  id: string;
  position: LatLngExpression;
  route: string;
  status: "onTime" | "delayed" | "critical";
}