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

export type TripShapePoint = {
    lat: number;
    lon: number;
    sequence: number;
};

export type TripShapeOutput = {
    tripId: string;
    routeId: string;
    shapeId: string;
    points: TripShapePoint[];
};

export type TripStop = {
    stopId: string;
    stopName: string;
    lat: number;
    lon: number;
    sequence: number;
    arrivalTime: string;    // "HH:mm:ss"
    departureTime: string;  // "HH:mm:ss"
};

export type TripStopsOutput = {
    tripId: string;
    routeId: string;
    stops: TripStop[];
};
