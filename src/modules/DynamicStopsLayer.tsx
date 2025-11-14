import React, { useState, useEffect, useCallback } from "react";
import { Marker, Popup, useMapEvents } from "react-leaflet";
import {
    getStopsInRect,
    getRoutesThroughStop,
    getTripsByRoute,
    getVehiclePosition,
} from "../api/map/map.requests";
import type {
    StopsInRectOutput,
    StopsInRectInput,
    RoutesThroughStopOutput,
} from "../api/map/map.types";

const MIN_ZOOM_TO_SHOW_STOPS = 16;

type Props = {
    onRouteClick: (routeId: string) => void;
};

const DynamicStopsLayer: React.FC<Props> = ({ onRouteClick }) => {
    const [stops, setStops] = useState<StopsInRectOutput[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [showZoomMessage, setShowZoomMessage] = useState<boolean>(false);

    const [activeStopId, setActiveStopId] = useState<string | null>(null);
    const [routesByStop, setRoutesByStop] = useState<
        Record<string, RoutesThroughStopOutput[]>
    >({});
    const [routesLoading, setRoutesLoading] = useState<boolean>(false);
    const [routesError, setRoutesError] = useState<string | null>(null);

    // NEW: маршруты с активными автобусами для конкретной остановки
    const [routesWithBusByStop, setRoutesWithBusByStop] = useState<Record<string, string[]>>(
        {}
    );
    const [checkingActiveRoutes, setCheckingActiveRoutes] = useState<boolean>(false);

    const map = useMapEvents({
        moveend: () => {
            fetchStopsInView();
        },
    });

    const fetchStopsInView = useCallback(async () => {
        const currentZoom = map.getZoom();
        if (currentZoom < MIN_ZOOM_TO_SHOW_STOPS) {
            setStops([]);
            setShowZoomMessage(true);
            return;
        }

        setShowZoomMessage(false);
        setLoading(true);

        try {
            const bounds = map.getBounds();
            const northEast = bounds.getNorthEast();
            const southWest = bounds.getSouthWest();

            const params: StopsInRectInput = {
                topLeftLat: northEast.lat,
                topLeftLon: southWest.lng,
                bottomRightLat: southWest.lat,
                bottomRightLon: northEast.lng,
            };

            const fetchedStops = await getStopsInRect(params);
            setStops(fetchedStops);
        } catch (error) {
            console.error("Failed to fetch stops:", error);
            alert("Failed to fetch stops: " + error);
        } finally {
            setLoading(false);
        }
    }, [map]);

    useEffect(() => {
        if (map.getZoom() < MIN_ZOOM_TO_SHOW_STOPS) {
            setShowZoomMessage(true);
        }
        fetchStopsInView();
    }, [fetchStopsInView, map]);

    const openStop = async (stopId: string) => {
        setActiveStopId(stopId);
        setRoutesError(null);

        if (routesByStop[stopId]) return;

        try {
            setRoutesLoading(true);
            const routes = await getRoutesThroughStop(stopId);
            setRoutesByStop((prev) => ({ ...prev, [stopId]: routes }));
        } catch (e: any) {
            console.error(e);
            setRoutesError(e?.message ?? "Не удалось загрузить маршруты");
        } finally {
            setRoutesLoading(false);
        }
    };

    // NEW: проверить маршруты, где есть хотя бы один автобус
    const checkActiveRoutesForStop = useCallback(
        async (stopId: string) => {
            const routes = routesByStop[stopId] ?? [];
            if (!routes.length) return;

            setCheckingActiveRoutes(true);
            try {
                const pairs = await Promise.all(
                    routes.map(async (r) => {
                        try {
                            const trips = await getTripsByRoute(r.routeId);
                            if (!trips.length) return [r.routeId, false] as const;
                            const pos = await Promise.all(
                                trips.map((t) => getVehiclePosition(t.tripId, 84600).catch(() => null))
                            );
                            const hasBus = pos.some((p) => p && p.lat != null && p.lon != null);
                            return [r.routeId, hasBus] as const;
                        } catch {
                            return [r.routeId, false] as const;
                        }
                    })
                );
                const actives = pairs.filter(([, ok]) => ok).map(([routeId]) => routeId);
                setRoutesWithBusByStop((prev) => ({ ...prev, [stopId]: actives }));
            } finally {
                setCheckingActiveRoutes(false);
            }
        },
        [routesByStop]
    );

    return (
        <>
            {loading && (
                <div className="map-overlay-message">
                    <div className="spinner"></div>
                    <span>Загрузка остановок...</span>
                </div>
            )}

            {showZoomMessage && !loading && (
                <div className="map-overlay-message">
                    <span>Приблизьте карту, чтобы увидеть остановки</span>
                </div>
            )}

            {stops.map((stop) => (
                <Marker
                    key={stop.id}
                    position={[stop.lat, stop.lon]}
                    eventHandlers={{
                        click: () => openStop(stop.id),
                    }}
                >
                    <Popup minWidth={280}>
                        <div style={{ display: "grid", gap: 8 }}>
                            <div>
                                <b>Остановка:</b> {stop.name}
                                <div style={{ fontSize: 12, opacity: 0.8 }}>{stop.id}</div>
                            </div>

                            {activeStopId === stop.id && (
                                <>
                                    {routesLoading && <div>Загрузка маршрутов…</div>}
                                    {routesError && (
                                        <div style={{ color: "crimson" }}>{routesError}</div>
                                    )}

                                    {!routesLoading && !routesError && (
                                        <>
                                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                <button
                                                    onClick={() => checkActiveRoutesForStop(stop.id)}
                                                    style={{
                                                        padding: "4px 8px",
                                                        borderRadius: 6,
                                                        border: "1px solid #ddd",
                                                        cursor: "pointer",
                                                    }}
                                                    title="Показать маршруты, где сейчас есть автобусы"
                                                >
                                                    Проверить активные маршруты
                                                </button>
                                                {checkingActiveRoutes && (
                                                    <span style={{ fontSize: 12 }}>…проверяю</span>
                                                )}
                                            </div>

                                            {routesWithBusByStop[stop.id] &&
                                                routesWithBusByStop[stop.id].length > 0 && (
                                                    <div>
                                                        <div style={{ margin: "6px 0", fontWeight: 600 }}>
                                                            С автобусами сейчас:
                                                        </div>
                                                        <ul
                                                            style={{
                                                                margin: 0,
                                                                paddingLeft: 16,
                                                                maxHeight: 120,
                                                                overflow: "auto",
                                                            }}
                                                        >
                                                            {routesByStop[stop.id]
                                                                .filter((r) =>
                                                                    routesWithBusByStop[stop.id].includes(r.routeId)
                                                                )
                                                                .map((r) => (
                                                                    <li key={`active-${r.routeId}`}>
                                                                        <button
                                                                            onClick={() => onRouteClick(r.routeId)}
                                                                            style={{
                                                                                background: "#f3fff3",
                                                                                border: "1px solid #bde5bd",
                                                                                padding: "4px 8px",
                                                                                borderRadius: 6,
                                                                                cursor: "pointer",
                                                                                width: "100%",
                                                                                textAlign: "left",
                                                                            }}
                                                                            title={`Показать маршрут ${r.shortName ?? r.routeId}`}
                                                                        >
                                                                            🚌 <b>{r.shortName ?? "—"}</b>{" "}
                                                                            <span style={{ opacity: 0.7 }}>
                                        ({r.routeId})
                                      </span>
                                                                        </button>
                                                                    </li>
                                                                ))}
                                                        </ul>
                                                    </div>
                                                )}

                                            <div>
                                                <div style={{ marginBottom: 6, fontWeight: 600 }}>
                                                    Все маршруты через остановку:
                                                </div>
                                                <ul
                                                    style={{
                                                        margin: 0,
                                                        paddingLeft: 16,
                                                        maxHeight: 160,
                                                        overflow: "auto",
                                                    }}
                                                >
                                                    {(routesByStop[stop.id] ?? []).map((r) => (
                                                        <li key={r.routeId}>
                                                            <button
                                                                onClick={() => onRouteClick(r.routeId)}
                                                                style={{
                                                                    background: "white",
                                                                    border: "1px solid #ddd",
                                                                    padding: "4px 8px",
                                                                    borderRadius: 6,
                                                                    cursor: "pointer",
                                                                    width: "100%",
                                                                    textAlign: "left",
                                                                }}
                                                                title={`Показать маршрут ${r.shortName ?? r.routeId}`}
                                                            >
                                                                <b>{r.shortName ?? "—"}</b>{" "}
                                                                <span style={{ opacity: 0.7 }}>({r.routeId})</span>
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}

                            {activeStopId !== stop.id && (
                                <div style={{ fontSize: 12, opacity: 0.8 }}>
                                    Нажмите на остановку, чтобы загрузить маршруты
                                </div>
                            )}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </>
    );
};

export default DynamicStopsLayer;
