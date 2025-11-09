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

        const Control = L.Control.extend({
            onAdd() {
                const container = L.DomUtil.create("div", "leaflet-bar");
                const btn = L.DomUtil.create("a", "", container);
                btn.href = "#";
                btn.title = "Очистить маршрут";
                btn.style.padding = "6px 10px";
                btn.style.cursor = "pointer";
                btn.style.userSelect = "none";
                btn.innerText = "✕ маршрут";

                L.DomEvent.on(btn, "click", (e: Event) => {
                    L.DomEvent.stop(e);
                    onClear();
                });

                return container;
            },
        });

        const control = new Control({ position: "topright" });
        control.addTo(map);

        return () => {
            control.remove();
        };
    }, [map, onClear, visible]);

    return null;
};

export default ClearRouteControl;
