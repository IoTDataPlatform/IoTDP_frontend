import { useState, type FC, type FormEvent } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import "./Map.css";
import { useMapData } from "../../hooks/useMapData";
import MapUI from "../../modules/MapUI";
import RouteLayer from "../../layers/RouteLayer/RouteLayer";
import VehiclesLayer from "../../layers/VehiclesLayer/VehiclesLayer";
import RouteTripsPanel from "../../modules/RouteTripsPanel";
import ClearRouteControl from "../../modules/ClearRouteControl";
import MapClickClear from "../../modules/MapClickClear";
import TripLayer from "../../layers/TripLayer/TripLayer";
import DynamicStopsLayer from "../../layers/DynamicStopsLayer/DynamicStopsLayer";
import AutoFocusOnSingleBus from "../../modules/AutoFocusOnSingleBus";

const MapRoot: FC = () => {
    const mapCenter: [number, number] = [59.3326, 18.0649];

    const [routeSearch, setRouteSearch] = useState<string>("");

    const {
        selectedRouteId,
        routeGeometry,
        trips,
        vehicles,
        selectedTripId,
        selectedTripShape,
        selectedTripStops,
        shownVehicles,
        anyLoading,
        loadingStates,
        errorStates,
        handleRouteClick,
        handleSelectTrip,
        clearRoute,
    } = useMapData();

    const onRouteSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!routeSearch.trim()) return;
        handleRouteClick(routeSearch.trim());
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

            <MapUI
                routeSearch={routeSearch}
                onRouteSearchChange={setRouteSearch}
                onRouteSearchSubmit={onRouteSearchSubmit}
                anyLoading={anyLoading}
                loadingStates={loadingStates}
                errorStates={errorStates}
            />

            <DynamicStopsLayer onRouteClick={handleRouteClick} />

            {/* Когда трип НЕ выбран — рисуем геометрию всего маршрута */}
            {routeShown && !selectedTripId && (
                <RouteLayer geometry={routeGeometry} showStops />
            )}

            {/* Когда трип выбран — рисуем ШЕЙП и ОСТАНОВКИ КОНКРЕТНОГО РЕЙСА */}
            {routeShown && selectedTripId && (
                <TripLayer
                    shape={selectedTripShape}
                    stops={selectedTripStops}
                />
            )}

            <VehiclesLayer vehicles={shownVehicles} />
            {routeShown && (
                <AutoFocusOnSingleBus
                    selectedTripId={selectedTripId}
                    vehicles={vehicles}
                />
            )}

            <RouteTripsPanel
                routeId={selectedRouteId}
                trips={trips}
                vehicles={vehicles}
                selectedTripId={selectedTripId}
                onSelectTrip={handleSelectTrip}
                onClearRoute={clearRoute}
            />

            <ClearRouteControl visible={routeShown} onClear={clearRoute} />
            <MapClickClear enabled={routeShown} onClear={clearRoute} />
        </MapContainer>
    );
};

export default MapRoot;
