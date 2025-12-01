import { useMemo, type FC } from "react";
import type { TripSummary, VehiclePosition } from "../api/map/map.types";

type Props = {
    routeId: string | null;
    trips: TripSummary[];
    vehicles: VehiclePosition[];
    selectedTripId: string | null;
    onSelectTrip: (tripId: string | null) => void;
    onClearRoute: () => void;
};

const RouteTripsPanel: FC<Props> = ({
    routeId,
    trips,
    vehicles,
    selectedTripId,
    onSelectTrip,
    onClearRoute,
}) => {
    const tripsWithBusIds = useMemo(
        () => new Set(vehicles.map((v) => v.tripId)),
        [vehicles]
    );
    const tripsWithBus = useMemo(
        () => trips.filter((t) => tripsWithBusIds.has(t.tripId)),
        [trips, tripsWithBusIds]
    );

    if (!routeId) return null;

    return (
        <div
            style={{
                position: "absolute",
                top: 10,
                left: 10,
                zIndex: 1000,
                background: "white",
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 10,
                maxHeight: 320,
                width: 300,
                overflowY: "auto",
                boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
            }}
            className="route-trips-panel"
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                }}
            >
                <b>Маршрут: {routeId}</b>
                <button
                    onClick={onClearRoute}
                    title="Очистить маршрут"
                    style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                    }}
                >
                    ✕
                </button>
            </div>

            {/* Кнопка «все рейсы» — маршрут не пропадает */}
            <div style={{ marginBottom: 8 }}>
                <button
                    onClick={() => onSelectTrip(null)}
                    style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        border:
                            selectedTripId === null
                                ? "2px solid #333"
                                : "1px solid #ddd",
                        background:
                            selectedTripId === null ? "#f3f3f3" : "white",
                        cursor: "pointer",
                    }}
                    title="Показать автобусы всех рейсов"
                >
                    Все рейсы ({trips.length})
                </button>
            </div>

            {/* Рейсы с активными автобусами */}
            <div style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    Рейсы с автобусами ({tripsWithBus.length})
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                    {tripsWithBus.map((t) => (
                        <button
                            key={`active-${t.tripId}`}
                            onClick={() => onSelectTrip(t.tripId)}
                            style={{
                                textAlign: "left",
                                padding: "6px 8px",
                                borderRadius: 6,
                                border:
                                    selectedTripId === t.tripId
                                        ? "2px solid #2c7"
                                        : "1px solid #bde5bd",
                                background:
                                    selectedTripId === t.tripId
                                        ? "#eaffea"
                                        : "#f3fff3",
                                cursor: "pointer",
                            }}
                            title="Показать автобус этого рейса"
                        >
                            🚌 <b>{t.tripId}</b>
                            <div style={{ fontSize: 12, opacity: 0.8 }}>
                                dir: {t.directionId} · shape: {t.shapeId}
                            </div>
                        </button>
                    ))}
                    {tripsWithBus.length === 0 && (
                        <div style={{ opacity: 0.7 }}>
                            Пока нет активных автобусов
                        </div>
                    )}
                </div>
            </div>

            {/* Все рейсы */}
            <div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    Все рейсы
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                    {trips.map((t) => (
                        <button
                            key={t.tripId}
                            onClick={() => onSelectTrip(t.tripId)}
                            style={{
                                textAlign: "left",
                                padding: "6px 8px",
                                borderRadius: 6,
                                border:
                                    selectedTripId === t.tripId
                                        ? "2px solid #333"
                                        : "1px solid #ddd",
                                background:
                                    selectedTripId === t.tripId
                                        ? "#f3f3f3"
                                        : "white",
                                cursor: "pointer",
                            }}
                        >
                            <b>{t.tripId}</b>
                            <div style={{ fontSize: 12, opacity: 0.8 }}>
                                dir: {t.directionId} · shape: {t.shapeId}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RouteTripsPanel;
