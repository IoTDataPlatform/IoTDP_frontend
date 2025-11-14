export type StopsInRectInput = {
    topLeftLat: number;
    topLeftLon: number;
    bottomRightLat: number;
    bottomRightLon: number;
}

export type StopsInRectOutput = {
    id: string;
    name: string;
    lat: number;
    lon: number;
}

export type RoutesThroughStopOutput = {
    routeId: string;
    shortName: string;
    longName: string | null;
    routeType: number;
}

export type RouteScheduleAtStopOutput = {
    stopId: string;
    routeId: string;
    date: string; // YYYY-MM-DD
    shortName: string;
    longName: string | null;
    routeType: number;
    times: string[];
}

type Stop = {
    id: string;
    name: string;
    lat: number;
    lon: number;
}

type Shape = {
    shapeId: string;
    points: Array<{"lat": number, "lon": number}>;
}

export type RouteGeometryOutput = {
    routeId: string;
    stops: Stop[];
    shapes: Shape[];
}

export type TripSummary = {
    tripId: string;
    serviceId: string;
    headsign: string | null;
    directionId: number;
    shapeId: string;
    shortName: string | null;
    blockId: string | null;
};

export type VehiclePosition = {
    tripId: string;
    vehicleId: string | null;
    lat: number | null;
    lon: number | null;
    speed: number | null;
    bearing: number | null;
    routeId: string | null;
    status: string | null;
    lastUpdated: string | null;
    inTransit: boolean | null;
};
