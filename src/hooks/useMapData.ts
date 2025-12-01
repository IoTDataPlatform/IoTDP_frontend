import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
    getRouteGeometry,
    getTripsByRoute,
    getVehiclePosition,
    getTripShape,
    getTripStops,
} from "../api/map/map.requests";

import type {
    RouteGeometryOutput,
    TripSummary,
    VehiclePosition,
    TripShapeOutput,
    TripStopsOutput,
} from "../api/map/map.types";

export const useMapData = () => {
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [routeGeometry, setRouteGeometry] =
        useState<RouteGeometryOutput | null>(null);
    const [routeLoading, setRouteLoading] = useState<boolean>(false);
    const [routeError, setRouteError] = useState<string | null>(null);

    const [trips, setTrips] = useState<TripSummary[]>([]);
    const [tripsLoading, setTripsLoading] = useState<boolean>(false);

    const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
    const [vehiclesLoading, setVehiclesLoading] = useState<boolean>(false);

    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
    const [selectedTripShape, setSelectedTripShape] =
        useState<TripShapeOutput | null>(null);
    const [selectedTripStops, setSelectedTripStops] =
        useState<TripStopsOutput | null>(null);
    const [tripDetailsLoading, setTripDetailsLoading] =
        useState<boolean>(false);
    const [tripDetailsError, setTripDetailsError] = useState<string | null>(
        null
    );
    const activeRouteRequestId = useRef<string | null>(null);

    const handleRouteClick = useCallback(async (routeId: string) => {
        const trimmed = routeId.trim();
        if (!trimmed) return;

        activeRouteRequestId.current = trimmed;

        setSelectedRouteId(trimmed);
        setRouteError(null);
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

            if (activeRouteRequestId.current !== trimmed) return;

            setRouteGeometry(geometry);
            setTrips(tripsResp);

            const positions = await Promise.all(
                tripsResp.map((t) =>
                    getVehiclePosition(t.tripId, 84600).catch(() => null)
                )
            );
            const ok = positions.filter(
                (v): v is VehiclePosition =>
                    !!v && v.lat != null && v.lon != null
            );
            setVehicles(ok);
        } catch (e: unknown) {
            if (activeRouteRequestId.current !== trimmed) return;
            console.error(e);
            if (e instanceof Error) {
                setRouteError(e.message);
            } else if (typeof e === "string") {
                setRouteError(e);
            } else {
                setRouteError("Не удалось загрузить данные маршрута");
            }
            setRouteGeometry(null);
            setTrips([]);
            setVehicles([]);
        } finally {
            if (activeRouteRequestId.current === trimmed) {
                setRouteLoading(false);
                setTripsLoading(false);
                setVehiclesLoading(false);
            }
        }
    }, []);

    const handleSelectTrip = useCallback(async (tripId: string | null) => {
        if (!tripId) {
            setSelectedTripId(null);
            setSelectedTripShape(null);
            setSelectedTripStops(null);
            setTripDetailsError(null);
            setTripDetailsLoading(false);
            return;
        }

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
        } catch (e: unknown) {
            console.error(e);
            if (e instanceof Error) {
                setTripDetailsError(e.message);
            } else if (typeof e === "string") {
                setTripDetailsError(e);
            } else {
                setTripDetailsError(
                    "Не удалось загрузить геометрию и остановки рейса"
                );
            }
            setSelectedTripShape(null);
            setSelectedTripStops(null);
        } finally {
            setTripDetailsLoading(false);
        }
    }, []);

    const clearRoute = useCallback(() => {
        setSelectedRouteId(null);
        setRouteGeometry(null);
        setRouteError(null);
        setTrips([]);
        setVehicles([]);
        setSelectedTripId(null);
        setSelectedTripShape(null);
        setSelectedTripStops(null);
        setTripDetailsError(null);
    }, []);

    const shownVehicles = useMemo(() => {
        if (!selectedTripId) return vehicles;
        return vehicles.filter((v) => v.tripId === selectedTripId);
    }, [vehicles, selectedTripId]);

    useEffect(() => {
        if (!selectedRouteId || trips.length === 0) return;

        let cancelled = false;
        const refresh = async () => {
            try {
                const positions = await Promise.all(
                    trips.map((t) =>
                        getVehiclePosition(t.tripId, 60).catch(() => null)
                    )
                );
                if (cancelled) return;
                const ok = positions.filter(
                    (v): v is VehiclePosition =>
                        !!v && v.lat != null && v.lon != null
                );
                setVehicles(ok);
            } catch (e) {
                if (!cancelled) {
                    console.error("Failed to refresh vehicles:", e);
                }
            }
        };

        refresh();
        const id = window.setInterval(refresh, 5000);

        return () => {
            cancelled = true;
            window.clearInterval(id);
        };
    }, [selectedRouteId, trips]);

    const anyLoading =
        routeLoading || tripsLoading || vehiclesLoading || tripDetailsLoading;

    return {
        selectedRouteId,
        routeGeometry,
        trips,
        vehicles,
        selectedTripId,
        selectedTripShape,
        selectedTripStops,
        shownVehicles,

        anyLoading,
        loadingStates: {
            routeLoading,
            tripsLoading,
            vehiclesLoading,
            tripDetailsLoading,
        },
        errorStates: { routeError, tripDetailsError },

        handleRouteClick,
        handleSelectTrip,
        clearRoute,
    };
};
