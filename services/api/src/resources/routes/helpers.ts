export type RouteAnnotation = {
    key: string;
    value: string;
};

export type RouteAnnotations = RouteAnnotation[];

export function addAnnotation(
  annotations: RouteAnnotations,
  newKey: string,
  newValue: string
): RouteAnnotations {
  const exists = annotations.some(
    (a) => a.key === newKey && a.value === newValue
  );

  if (!exists) {
    return [...annotations, { key: newKey, value: newValue }];
  }

  return annotations;
}

export function removeAnnotation(
  annotations: RouteAnnotations,
  targetKey: string,
): RouteAnnotations {
  return annotations.filter(
    (a) => !(a.key === targetKey)
  );
}

export type PathRoute = {
    toService: string;
    path: string;
};

export type PathRoutes = PathRoute[];

export function addServicePathRoute(
  pathRoutes: PathRoutes,
  newToService: string,
  newPath: string
): PathRoutes {
  const exists = pathRoutes.some(
    (a) => a.toService === newToService && a.path === newPath
  );

  if (!exists) {
    return [...pathRoutes, { toService: newToService, path: newPath }];
  }

  return pathRoutes;
}

export function removeServicePathRoute(
  pathRoutes: PathRoutes,
  targetToService: string,
  targetPath: string
): PathRoutes {
  return pathRoutes.filter(
    (a) => !(a.toService === targetToService && a.path === targetPath)
  );
}