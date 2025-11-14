import React, { useMemo } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { VehiclePosition } from "../api/map/map.types";
import busSvg from "../assets/bus-svgrepo-com.svg"; // путь подправь под свой проект

// divIcon с <img>, поворачиваем по bearing
const busIcon = (bearing?: number | null) =>
    L.divIcon({
        className: "bus-icon",
        html: `<img src="${busSvg}" alt="bus" style="width:24px;height:24px;transform: rotate(${bearing ?? 0}deg);" />`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });

type Props = { vehicles: VehiclePosition[] };

const VehiclesLayer: React.FC<Props> = ({ vehicles }) => {
    const filtered = useMemo(
        () => vehicles.filter(v => v.lat != null && v.lon != null),
        [vehicles]
    );

    return (
        <>
            {filtered.map(v => (
                <Marker
                    key={v.tripId}
                    position={[v.lat as number, v.lon as number]}
                    icon={busIcon(v.bearing ?? 0)}
                >
                    <Popup>
                        <div style={{ display: "grid", gap: 4 }}>
                            <b>Автобус</b>
                            <div>tripId: {v.tripId}</div>
                            {v.vehicleId && <div>vehicleId: {v.vehicleId}</div>}
                            {v.lastUpdated && <div>обновл.: {new Date(v.lastUpdated).toLocaleString()}</div>}
                            {v.speed != null && <div>скорость: {v.speed?.toFixed(1)} км/ч</div>}
                            {v.bearing != null && <div>курс: {v.bearing}°</div>}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </>
    );
};

export default VehiclesLayer;
