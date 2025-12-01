import React from "react";

interface MapUIProps {
    routeSearch: string;
    onRouteSearchChange: (value: string) => void;
    onRouteSearchSubmit: (e: React.FormEvent) => void;

    anyLoading: boolean;
    loadingStates: {
        routeLoading: boolean;
        tripsLoading: boolean;
        vehiclesLoading: boolean;
        tripDetailsLoading: boolean;
    };
    errorStates: {
        routeError: string | null;
        tripDetailsError: string | null;
    };
}

const MapUI: React.FC<MapUIProps> = ({
    routeSearch,
    onRouteSearchChange,
    onRouteSearchSubmit,
    anyLoading,
    loadingStates,
    errorStates,
}) => {
    return (
        <>
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
                <form
                    onSubmit={onRouteSearchSubmit}
                    style={{ display: "flex", gap: 8 }}
                >
                    <input
                        type="text"
                        placeholder="ID маршрута..."
                        value={routeSearch}
                        onChange={(e) => onRouteSearchChange(e.target.value)}
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
                        title="Показать маршрут по введеному ID"
                    >
                        Найти
                    </button>
                </form>
            </div>

            {/* Оверлей загрузки / ошибок */}
            {anyLoading && (
                <div className="map-overlay-message">
                    <div className="spinner"></div>
                    <span>
                        {loadingStates.routeLoading
                            ? "Загрузка геометрии маршрута... "
                            : ""}
                        {loadingStates.tripsLoading
                            ? "Загрузка рейсов... "
                            : ""}
                        {loadingStates.vehiclesLoading
                            ? "Загрузка автобусов... "
                            : ""}
                        {loadingStates.tripDetailsLoading
                            ? "Загрузка геометрии рейса и остановок... "
                            : ""}
                    </span>
                </div>
            )}

            {errorStates.routeError && !loadingStates.routeLoading && (
                <div
                    className="map-overlay-message"
                    style={{ color: "crimson" }}
                >
                    {errorStates.routeError}
                </div>
            )}

            {errorStates.tripDetailsError &&
                !loadingStates.tripDetailsLoading && (
                    <div
                        className="map-overlay-message"
                        style={{ top: "auto", bottom: 10, color: "crimson" }}
                    >
                        {errorStates.tripDetailsError}
                    </div>
                )}
        </>
    );
};

export default MapUI;
