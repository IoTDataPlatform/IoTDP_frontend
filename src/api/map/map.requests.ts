import { createRequest } from "../createRequest";
import { projectConfig } from "../../config";
import type {
    RouteGeometryOutput, RouteScheduleAtStopOutput, RoutesThroughStopOutput, StopsInRectInput, StopsInRectOutput,
    TripSummary, VehiclePosition
} from "./map.types";

const stopsUrlPrefix = `${projectConfig.backendUrl}/stops`;
const routesUrlPrefix = `${projectConfig.backendUrl}/routes`;

export async function getStopsInRect(params: StopsInRectInput): Promise<StopsInRectOutput[]> {
    return createRequest<StopsInRectOutput[]>({
        url: `${stopsUrlPrefix}/in-rect`,
        params,
    })
};

export async function getRoutesThroughStop(stopId: string): Promise<RoutesThroughStopOutput[]> {
    return createRequest<RoutesThroughStopOutput[]>({
        url: `${stopsUrlPrefix}/${stopId}/routes`
    })
};

export async function getRouteScheduleAtStop(stopId: string, routeId: string, params: { ["date"]: string }) 
: Promise<RouteScheduleAtStopOutput> {
    return createRequest<RouteScheduleAtStopOutput>({
        url: `${stopsUrlPrefix}/${stopId}/routes/${routeId}/times`,
        params,
    })
};

export async function getRouteGeometry(routeId: string): Promise<RouteGeometryOutput> {
    return createRequest<RouteGeometryOutput>({
        url: `${routesUrlPrefix}/${routeId}/geometry`
    })
};

export async function getTripsByRoute(routeId: string): Promise<TripSummary[]> {
    return createRequest<TripSummary[]>({
        url: `${projectConfig.backendUrl}/routes/${routeId}/trips`,
    });
}

export async function getVehiclePosition(tripId: string, freshSeconds = 600): Promise<VehiclePosition> {
    return createRequest<VehiclePosition>({
        url: `${projectConfig.backendUrl}/position_redis/${tripId}`,
        params: { freshSeconds },
    });
}
