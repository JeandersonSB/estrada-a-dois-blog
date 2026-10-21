import type { Coordinates } from './helpers';

export type OriginPlace = Coordinates & { label: string };

// Explicit user searches only; callers cache results and prevent repeated requests.
export async function findOriginPlaces(query: string, signal: AbortSignal): Promise<OriginPlace[]> {
  const url = new URL(process.env.NEXT_PUBLIC_BIKER_GEOCODER_URL || 'https://photon.komoot.io/api/');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '3');
  const response = await fetch(url, { signal, credentials: 'omit', referrerPolicy: 'strict-origin' });
  if (!response.ok) throw new Error('A busca de endereços está indisponível. Tente novamente ou use sua localização.');
  const data: unknown = await response.json();
  if (!data || typeof data !== 'object' || !('features' in data) || !Array.isArray(data.features)) return [];
  const places: OriginPlace[] = [];
  for (const feature of data.features) {
    if (!feature || typeof feature !== 'object') continue;
    const geometry = feature.geometry;
    const properties = feature.properties;
    if (!geometry || geometry.type !== 'Point' || !Array.isArray(geometry.coordinates) || !properties || typeof properties !== 'object') continue;
    const [lng, lat] = geometry.coordinates;
    if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
    const parts = [properties.name, [properties.street, properties.housenumber].filter(v => typeof v === 'string').join(' '), properties.city, properties.state, properties.country]
      .filter((v): v is string => typeof v === 'string' && !!v.trim());
    if (!parts.length) continue;
    places.push({ lat, lng, label: [...new Set(parts)].join(', ') });
  }
  return places;
}
