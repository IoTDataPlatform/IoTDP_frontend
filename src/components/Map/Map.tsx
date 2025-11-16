import React, { useState, useCallback, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./Map.css";

import DynamicStopsLayer from "../../modules/DynamicStopsLayer";
import RouteLayer from "../../modules/RouteLayer";
import VehiclesLayer from "../../modules/VehiclesLayer";
import RouteTripsPanel from "../../modules/RouteTripsPanel";
import ClearRouteControl from "../../modules/ClearRouteControl";
import MapClickClear from "../../modules/MapClickClear";
import TripLayer from "../../modules/TripLayer";

import {
    getRouteGeometry,
    getTripsByRoute,
    getVehiclePosition,
    getTripShape,
    getTripStops,
} from "../../api/map/map.requests";

import type {
    RouteGeometryOutput,
    TripSummary,
    VehiclePosition,
    TripShapeOutput,
    TripStopsOutput,
} from "../../api/map/map.types";

const MapRoot: React.FC = () => {
    const mapCenter: [number, number] = [59.3326, 18.0649];

    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [routeGeometry, setRouteGeometry] = useState<RouteGeometryOutput | null>(null);
    const [routeLoading, setRouteLoading] = useState<boolean>(false);
    const [routeError, setRouteError] = useState<string | null>(null);

    const [trips, setTrips] = useState<TripSummary[]>([]);
    const [tripsLoading, setTripsLoading] = useState<boolean>(false);

    const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
    const [vehiclesLoading, setVehiclesLoading] = useState<boolean>(false);

    // выбор конкретного рейса (трипа)
    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
    const [selectedTripShape, setSelectedTripShape] = useState<TripShapeOutput | null>(null);
    const [selectedTripStops, setSelectedTripStops] = useState<TripStopsOutput | null>(null);
    const [tripDetailsLoading, setTripDetailsLoading] = useState<boolean>(false);
    const [tripDetailsError, setTripDetailsError] = useState<string | null>(null);

    // поиск по routeId
    const [routeSearch, setRouteSearch] = useState<string>("");

    /** Загрузка данных по маршруту (геометрия, список рейсов, стартовые позиции автобусов) */
    const handleRouteClick = useCallback(async (routeId: string) => {
        const trimmed = routeId.trim();
        if (!trimmed) return;

        setSelectedRouteId(trimmed);
        setRouteError(null);

        // сбрасываем выбор трипа и его данные
        setSelectedTripId(null);
        setSelectedTripShape(null);
        setSelectedTripStops(null);
        setTripDetailsError(null);

        setRouteLoading(true);
        setTripsLoading(true);
        setVehiclesLoading(true);
        setVehicles([]);

        try {
            const [geometry, tripsResp] = await Promise.all([
                getRouteGeometry(trimmed),
                getTripsByRoute(trimmed),
            ]);

            setRouteGeometry(geometry);
            setTrips(tripsResp);

            // первая загрузка всех автобусов по всем трипам (широкое окно свежести)
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

    /** Выбор / сброс конкретного трипа */
    const handleSelectTrip = useCallback(
        async (tripId: string | null) => {
            // сброс выбора трипа: возвращаемся к геометрии маршрута
            if (!tripId) {
                setSelectedTripId(null);
                setSelectedTripShape(null);
                setSelectedTripStops(null);
                setTripDetailsError(null);
                setTripDetailsLoading(false);
                return;
            }

            // выбор конкретного рейса
            setSelectedTripId(tripId);
            setTripDetailsError(null);
            setTripDetailsLoading(true);

            try {
                const [shape, stops] = await Promise.all([
                    getTripShape(tripId),
                    getTripStops(tripId),
                ]);
                setSelectedTripShape(shape);
                setSelectedTripStops(stops);
            } catch (e: any) {
                console.error(e);
                setSelectedTripShape(null);
                setSelectedTripStops(null);
                setTripDetailsError(
                    e?.message ?? "Не удалось загрузить геометрию и остановки рейса"
                );
            } finally {
                setTripDetailsLoading(false);
            }
        },
        []
    );

    /** Полная очистка выбора маршрута + трипа */
    const clearRoute = useCallback(() => {
        setSelectedRouteId(null);
        setRouteGeometry(null);
        setRouteError(null);

        setTrips([]);
        setTripsLoading(false);

        setVehicles([]);
        setVehiclesLoading(false);

        setSelectedTripId(null);
        setSelectedTripShape(null);
        setSelectedTripStops(null);
        setTripDetailsError(null);
        setTripDetailsLoading(false);
    }, []);

    /** Фильтрация автобусов — для выбранного трипа показываем только его */
    const shownVehicles = useMemo(() => {
        if (!selectedTripId) return vehicles;
        return vehicles.filter((v) => v.tripId === selectedTripId);
    }, [vehicles, selectedTripId]);

    /** Автообновление позиций автобусов раз в 5 секунд */
    useEffect(() => {
        if (!selectedRouteId || trips.length === 0) return;

        let cancelled = false;

        const refresh = async () => {
            try {
                const positions = await Promise.all(
                    trips.map((t) => getVehiclePosition(t.tripId, 60).catch(() => null))
                );
                if (cancelled) return;
                const ok = positions.filter(
                    (v): v is VehiclePosition => !!v && v.lat != null && v.lon != null
                );
                setVehicles(ok);
            } catch (e) {
                if (!cancelled) {
                    console.error("Failed to refresh vehicles:", e);
                }
            }
        };

        // сразу обновим один раз
        refresh();
        const id = window.setInterval(refresh, 5000);

        return () => {
            cancelled = true;
            window.clearInterval(id);
        };
    }, [selectedRouteId, trips]);

    /** Автофокус на автобус выбранного трипа */
    const AutoFocusOnSingleBus: React.FC = () => {
        const map = useMap();
        useEffect(() => {
            if (!selectedTripId) return;
            const bus = vehicles.find(
                (v) => v.tripId === selectedTripId && v.lat != null && v.lon != null
            );
            if (bus) {
                map.flyTo(
                    [bus.lat as number, bus.lon as number],
                    Math.max(map.getZoom(), 16)
                );
            }
        }, [map, selectedTripId, vehicles]);
        return null;
    };

    const routeShown = !!selectedRouteId;

    const onRouteSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!routeSearch.trim()) return;
        handleRouteClick(routeSearch.trim());
    };

    const anyLoading =
        routeLoading || tripsLoading || vehiclesLoading || tripDetailsLoading;

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

            {/* Поиск по routeId */}
            <div
                style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    zIndex: 1000,
                    background: "white",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    padding: 8,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                }}
            >
                <form onSubmit={onRouteSearchSubmit} style={{ display: "flex", gap: 8 }}>
                    <input
                        type="text"
                        placeholder="routeId…"
                        value={routeSearch}
                        onChange={(e) => setRouteSearch(e.target.value)}
                        style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: "1px solid #ccc",
                            minWidth: 160,
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            border: "1px solid #0077ff",
                            background: "#0077ff",
                            color: "white",
                            cursor: "pointer",
                        }}
                        title="Показать маршрут по routeId"
                    >
                        Найти
                    </button>
                </form>
            </div>

            {/* Кликабельные остановки для выбора маршрута */}
            <DynamicStopsLayer
                onRouteClick={handleRouteClick}
            />

            {/* Оверлей загрузки / ошибок */}
            {anyLoading && (
                <div className="map-overlay-message">
                    <div className="spinner"></div>
                    <span>
                        {routeLoading ? "Загрузка геометрии маршрута… " : ""}
                        {tripsLoading ? "Загрузка рейсов… " : ""}
                        {vehiclesLoading ? "Загрузка автобусов… " : ""}
                        {tripDetailsLoading ? "Загрузка геометрии рейса и остановок… " : ""}
                    </span>
                </div>
            )}

            {routeError && !routeLoading && (
                <div className="map-overlay-message" style={{ color: "crimson" }}>
                    {routeError}
                </div>
            )}

            {tripDetailsError && !tripDetailsLoading && (
                <div
                    className="map-overlay-message"
                    style={{ top: "auto", bottom: 10, color: "crimson" }}
                >
                    {tripDetailsError}
                </div>
            )}

            {/* Когда трип НЕ выбран — рисуем геометрию всего маршрута */}
            {routeShown && !selectedTripId && (
                <RouteLayer geometry={routeGeometry} showStops />
            )}

            {/* Когда трип выбран — рисуем ШЕЙП и ОСТАНОВКИ КОНКРЕТНОГО РЕЙСА */}
            {routeShown && selectedTripId && (
                <TripLayer shape={selectedTripShape} stops={selectedTripStops} />
            )}

            {/* Автобусы: для выбранного трипа — только его, иначе все по маршруту */}
            <VehiclesLayer vehicles={shownVehicles} />
            {routeShown && <AutoFocusOnSingleBus />}

            {/* Панель рейсов маршрута (UX трипов) */}
            <RouteTripsPanel
                routeId={selectedRouteId}
                trips={trips}
                vehicles={vehicles}
                selectedTripId={selectedTripId}
                onSelectTrip={handleSelectTrip}
                onClearRoute={clearRoute}
            />

            {/* Очистка маршрута */}
            <ClearRouteControl visible={routeShown} onClear={clearRoute} />
            <MapClickClear enabled={routeShown} onClear={clearRoute} />
        </MapContainer>
    );
};

export default MapRoot;
