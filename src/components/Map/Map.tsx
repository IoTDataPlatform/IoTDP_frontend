import React, { useState, useCallback, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./Map.css";

import DynamicStopsLayer from "../../modules/DynamicStopsLayer";
import RouteLayer from "../../modules/RouteLayer";
import VehiclesLayer from "../../modules/VehiclesLayer";
import RouteTripsPanel from "../../modules/RouteTripsPanel";

import {
    getRouteGeometry,
    getTripsByRoute,
    getVehiclePosition,
} from "../../api/map/map.requests";
import type {
    RouteGeometryOutput,
    TripSummary,
    VehiclePosition,
} from "../../api/map/map.types";
import ClearRouteControl from "../../modules/ClearRouteControl";
import MapClickClear from "../../modules/MapClickClear";

const MapRoot: React.FC = () => {
    const mapCenter: [number, number] = [59.3326, 18.0649];

    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [routeGeometry, setRouteGeometry] = useState<RouteGeometryOutput | null>(null);
    const [routeLoading, setRouteLoading] = useState<boolean>(false);
    const [routeError, setRouteError] = useState<string | null>(null);

    const [trips, setTrips] = useState<TripSummary[]>([]);
    const [tripsLoading, setTripsLoading] = useState<boolean>(false);
    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

    const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
    const [vehiclesLoading, setVehiclesLoading] = useState<boolean>(false);

    const handleRouteClick = useCallback(async (routeId: string) => {
        setSelectedRouteId(routeId);
        setSelectedTripId(null);
        setRouteError(null);

        setRouteLoading(true);
        setTripsLoading(true);
        setVehiclesLoading(true);
        setVehicles([]);

        try {
            const [geometry, tripsResp] = await Promise.all([
                getRouteGeometry(routeId),
                getTripsByRoute(routeId),
            ]);
            setRouteGeometry(geometry);
            setTrips(tripsResp);

            // загрузка всех автобусов по всем трипам (широкое окно свежести)
            const positions = await Promise.all(
                tripsResp.map((t) => getVehiclePosition(t.tripId, 84600).catch(() => null))
            );
            const ok = positions.filter(
                (v): v is VehiclePosition => !!v && v.lat != null && v.lon != null
            );
            setVehicles(ok);
        } catch (e: any) {
            console.error(e);
            setRouteError(e?.message ?? "Не удалось загрузить данные маршрута");
            setRouteGeometry(null);
            setTrips([]);
            setVehicles([]);
        } finally {
            setRouteLoading(false);
            setTripsLoading(false);
            setVehiclesLoading(false);
        }
    }, []);

    const clearRoute = useCallback(() => {
        setSelectedRouteId(null);
        setSelectedTripId(null);
        setRouteGeometry(null);
        setTrips([]);
        setVehicles([]);
        setRouteError(null);
    }, []);

    const shownVehicles = useMemo(() => {
        if (!selectedTripId) return vehicles;
        return vehicles.filter((v) => v.tripId === selectedTripId);
    }, [vehicles, selectedTripId]);

    // авто-фокус на автобус выбранного трипа
    const AutoFocusOnSingleBus: React.FC = () => {
        const map = useMap();
        useEffect(() => {
            if (!selectedTripId) return;
            const bus = vehicles.find(
                (v) => v.tripId === selectedTripId && v.lat != null && v.lon != null
            );
            if (bus) map.flyTo([bus.lat as number, bus.lon as number], Math.max(map.getZoom(), 16));
        }, [map, selectedTripId, vehicles]);
        return null;
    };

    const routeShown = !!selectedRouteId;

    return (
        <MapContainer
            center={mapCenter}
            zoom={14}
            style={{ height: "80vh", width: "80vw", position: "relative" }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <DynamicStopsLayer onRouteClick={handleRouteClick} />

            {(routeLoading || tripsLoading || vehiclesLoading) && (
                <div className="map-overlay-message">
                    <div className="spinner"></div>
                    <span>
            {routeLoading ? "Загрузка геометрии… " : ""}
                        {tripsLoading ? "Загрузка рейсов… " : ""}
                        {vehiclesLoading ? "Загрузка автобусов… " : ""}
          </span>
                </div>
            )}
            {routeError && !routeLoading && (
                <div className="map-overlay-message" style={{ color: "crimson" }}>
                    {routeError}
                </div>
            )}

            <RouteLayer geometry={routeGeometry} showStops />

            <VehiclesLayer vehicles={shownVehicles} />
            {routeShown && <AutoFocusOnSingleBus />}

            <RouteTripsPanel
                routeId={selectedRouteId}
                trips={trips}
                vehicles={vehicles}
                selectedTripId={selectedTripId}
                onSelectTrip={setSelectedTripId}
                onClearRoute={clearRoute}
            />

            <ClearRouteControl visible={routeShown} onClear={clearRoute} />
            <MapClickClear enabled={routeShown} onClear={clearRoute} />
        </MapContainer>
    );
};

export default MapRoot;
