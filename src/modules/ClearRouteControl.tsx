import React, { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

type Props = {
    visible: boolean;
    onClear: () => void;
};

const ClearRouteControl: React.FC<Props> = ({ visible, onClear }) => {
    const map = useMap();

    useEffect(() => {
        if (!visible) return;

        const control = new L.Control({ position: "topright" });

        control.onAdd = () => {
            const container = L.DomUtil.create("div", "leaflet-bar");
            const btn = L.DomUtil.create("a", "", container);

            btn.href = "#";
            btn.title = "Очистить маршрут";
            btn.role = "button";
            btn.style.padding = "6px 10px";
            btn.style.cursor = "pointer";
            btn.style.userSelect = "none";
            btn.style.background = "white";
            btn.style.fontSize = "14px";
            btn.innerText = "✕ маршрут";

            L.DomEvent.on(btn, "click", (e) => {
                L.DomEvent.stop(e);
                onClear();
            });

            L.DomEvent.disableClickPropagation(container);

            return container;
        };

        control.addTo(map);

        return () => {
            control.remove();
        };
    }, [map, visible, onClear]);

    return null;
};

export default ClearRouteControl;
