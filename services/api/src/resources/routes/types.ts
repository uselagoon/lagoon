
export type RouteAnnotation = {
    key: string;
    value: string;
};

export type RouteAnnotations = RouteAnnotation[];

export type PathRoute = {
    toService: string;
    path: string;
};

export type PathRoutes = PathRoute[];