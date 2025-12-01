import { useEffect, type FC } from "react";
import { useMap } from "react-leaflet";

export const AutoFocusOnSingleBus: FC<{
    selectedTripId: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vehicles: any[];
}> = ({ selectedTripId, vehicles }) => {
    const map = useMap();
    useEffect(() => {
        if (!selectedTripId) return;
        console.log(vehicles);
        const bus = vehicles.find(
            (v) => v.tripId === selectedTripId && v.lat != null && v.lon != null
        );

        if (bus) {
            map.flyTo(
                [bus.lat as number, bus.lon as number],
                Math.max(map.getZoom(), 16),
                { animate: true, duration: 1.5 }
            );
        }
    }, [map, selectedTripId, vehicles]);
    return null;
};

export default AutoFocusOnSingleBus;
