export type Coordinates = { lat: number; lng: number };
export type RoutePoint = Coordinates | string;
export const MAX_ROUTE_LOCATIONS = 10;

function routePointText(point: RoutePoint) {
  if (typeof point === 'string') {
    if (!point.trim()) throw new Error('Informe o ponto de partida.');
    return point.trim();
  }
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng) || Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180) {
    throw new Error('Localização inválida.');
  }
  return `${point.lat},${point.lng}`;
}

export function mapsRouteUrl(points: readonly RoutePoint[]) {
  if (points.length < 2 || points.length > MAX_ROUTE_LOCATIONS) throw new Error('Escolha de 2 a 10 locais, contando origem e destino.');
  const locations = points.map(routePointText);
  const params = new URLSearchParams({ api: '1', origin: locations[0], destination: locations.at(-1)!, travelmode: 'driving' });
  if (locations.length > 2) params.set('waypoints', locations.slice(1, -1).join('|'));
  const url = `https://www.google.com/maps/dir/?${params}`;
  if (url.length > 2048) throw new Error('O endereço ficou muito longo. Use uma cidade ou um endereço mais curto.');
  return url;
}

// Mobile-browser URLs support three intermediate waypoints per leg.
// Adjacent legs share the last/first point so no stop is dropped.
export function splitRoute<T>(points: readonly T[]): T[][] {
  const legs: T[][] = [];
  for (let start = 0; start < points.length - 1; start += 4) legs.push(points.slice(start, start + 5));
  return legs;
}
export function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
export function matchesSearch(query: string, terms: string[]) {
  const text = normalize(terms.join(' '));
  const words = new Set(text.split(/\s+/));
  return normalize(query).split(/\s+/).filter(Boolean).every(term =>
    term.length <= 2 || /^\d+$/.test(term) ? words.has(term) : text.includes(term)
  );
}
// Great-circle distance, not road distance. Routing apps calculate the road trip.
export function distanceKm(a: Coordinates, b: Coordinates) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, h))));
}
export function rankNextStops<T extends Coordinates & { id: string; name: string }>(catalog: readonly T[], stopIds: readonly string[], distances: Readonly<Record<string, number | null>>, visited: readonly string[]) {
  return catalog.filter(m => !stopIds.includes(m.id))
    .map(m => ({ ...m, distance: distances[m.id] ?? null }))
    .sort((a, b) => Number(visited.includes(a.id)) - Number(visited.includes(b.id))
      || (a.distance === null ? Infinity : a.distance) - (b.distance === null ? Infinity : b.distance)
      || a.name.localeCompare(b.name));
}
export function mapsUrl(origin: Coordinates, destination: Coordinates) {
  return mapsRouteUrl([origin, destination]);
}
export function wazeUrl(destination: Coordinates) {
  return `https://www.waze.com/ul?${new URLSearchParams({ ll: `${destination.lat},${destination.lng}`, navigate: 'yes' })}`;
}
