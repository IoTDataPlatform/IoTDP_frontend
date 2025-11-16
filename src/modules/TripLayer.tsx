import React, { useEffect, useMemo, useRef } from "react";
import { Polyline, Marker, Popup, useMap } from "react-leaflet";
import L, {type LatLngExpression } from "leaflet";
import "leaflet-polylinedecorator";
import type { TripShapeOutput, TripStopsOutput } from "../api/map/map.types";
import busStopPng from "../assets/bus-station.png";

type Props = {
    shape: TripShapeOutput | null;
    stops: TripStopsOutput | null;
};

const stopIcon = L.icon({
    iconUrl: busStopPng,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
});

const TripLayer: React.FC<Props> = ({ shape, stops }) => {
    const map = useMap();
    const arrowsLayerRef = useRef<L.Layer | null>(null);

    const polyline: LatLngExpression[] = useMemo(() => {
        if (!shape) return [];
        return [...shape.points]
            .sort((a, b) => a.sequence - b.sequence)
            .map((p) => [p.lat, p.lon] as LatLngExpression);
    }, [shape]);

    useEffect(() => {
        if (!shape || !shape.points.length) return;
        const bounds = L.latLngBounds(
            shape.points.map((p) => [p.lat, p.lon] as [number, number])
        );
        map.fitBounds(bounds.pad(0.1));
    }, [shape, map]);

    useEffect(() => {
        if (arrowsLayerRef.current) {
            map.removeLayer(arrowsLayerRef.current);
            arrowsLayerRef.current = null;
        }

        if (!polyline.length) return;

        const baseLine = L.polyline(polyline);

        const decorator = (L as any).polylineDecorator(baseLine, {
            patterns: [
                {
                    offset: "5%",
                    repeat: "10%",
                    symbol: (L as any).Symbol.arrowHead({
                        pixelSize: 8,
                        polygon: false,
                        pathOptions: {
                            weight: 3,
                            color: "#3388ff",
                            fillColor: "#3388ff",
                            fillOpacity: 1,
                        },
                    }),
                },
            ],
        });

        decorator.addTo(map);
        arrowsLayerRef.current = decorator;

        return () => {
            if (arrowsLayerRef.current) {
                map.removeLayer(arrowsLayerRef.current);
                arrowsLayerRef.current = null;
            }
        };
    }, [polyline, map]);

    if (!shape) return null;

    return (
        <>
            <Polyline positions={polyline} />

            {stops?.stops
                ?.slice()
                .sort((a, b) => a.sequence - b.sequence)
                .map((st) => (
                    <Marker
                        key={st.stopId}
                        position={[st.lat, st.lon]}
                        icon={stopIcon}
                    >
                        <Popup>
                            <b>{st.stopName}</b>
                            <div style={{ fontSize: 12, opacity: 0.8 }}>{st.stopId}</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>
                                {st.arrivalTime === st.departureTime ? (
                                    <>Время: {st.arrivalTime}</>
                                ) : (
                                    <>
                                        Прибытие: {st.arrivalTime}
                                        <br />
                                        Отправление: {st.departureTime}
                                    </>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
        </>
    );
};

export default TripLayer;
