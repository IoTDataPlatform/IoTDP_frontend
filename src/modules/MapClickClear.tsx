import { useEffect, type FC } from "react";
import { useMapEvents } from "react-leaflet";

type Props = {
    enabled: boolean;
    onClear: () => void;
};

const MapClickClear: FC<Props> = ({ enabled, onClear }) => {
    useMapEvents({
        click(e) {
            if (!enabled) return;
            // если кликнули не по слою, где есть "interactive" элемент
            const target = e.originalEvent.target as HTMLElement;
            const insidePopupOrMarker =
                target.closest(".leaflet-popup") ||
                target.closest(".leaflet-interactive") ||
                target.closest(".leaflet-marker-icon") ||
                target.closest(".leaflet-control") ||
                target.closest(".route-trips-panel");
            if (!insidePopupOrMarker) onClear();
        },
    });

    // запрет прокрутки страницы при нажатии Esc в фокусе на доке
    useEffect(() => {
        if (!enabled) return;
        const onKey = (ev: KeyboardEvent) => {
            if (ev.key === "Escape") onClear();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [enabled, onClear]);

    return null;
};

export default MapClickClear;
