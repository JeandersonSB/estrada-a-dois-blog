export type Coordinates = { lat: number; lng: number };
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
export function mapsUrl(origin: Coordinates, destination: Coordinates) {
  return `https://www.google.com/maps/dir/?${new URLSearchParams({ api: '1', origin: `${origin.lat},${origin.lng}`, destination: `${destination.lat},${destination.lng}`, travelmode: 'driving' })}`;
}
export function wazeUrl(destination: Coordinates) {
  return `https://www.waze.com/ul?${new URLSearchParams({ ll: `${destination.lat},${destination.lng}`, navigate: 'yes' })}`;
}
