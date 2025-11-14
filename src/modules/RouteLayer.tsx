import React, { useEffect, useMemo } from "react";
import { Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { RouteGeometryOutput } from "../api/map/map.types";

type Props = {
    geometry: RouteGeometryOutput | null;
    showStops?: boolean;
};

const RouteLayer: React.FC<Props> = ({ geometry, showStops = true }) => {
    const map = useMap();

    const polylines: L.LatLngExpression[][] = useMemo(() => {
        if (!geometry) return [];
        return geometry.shapes.map((s) =>
            s.points.map((p) => [p.lat, p.lon] as L.LatLngExpression)
        );
    }, [geometry]);

    useEffect(() => {
        if (!geometry) return;
        // fit bounds по всем точкам
        const allPoints = geometry.shapes.flatMap((s) =>
            s.points.map((p) => [p.lat, p.lon] as [number, number])
        );
        if (allPoints.length > 1) {
            const bounds = L.latLngBounds(allPoints);
            map.fitBounds(bounds.pad(0.1));
        }
    }, [geometry, map]);

    if (!geometry) return null;

    return (
        <>
            {polylines.map((coords, idx) => (
                <Polyline key={`${geometry.routeId}-${idx}`} positions={coords} />
            ))}

            {showStops &&
                geometry.stops.map((st) => (
                    <Marker key={st.id} position={[st.lat, st.lon]}>
                        <Popup>
                            <b>{st.name}</b>
                            <div style={{ fontSize: 12, opacity: 0.8 }}>{st.id}</div>
                        </Popup>
                    </Marker>
                ))}
        </>
    );
};

export default RouteLayer;
