import type { Coordinates } from './helpers';

export type RoadMatrix = { keys: string[]; distances: (number | null)[][] };
export const coordinateKey = (point: Coordinates) => `${point.lng},${point.lat}`;

export function parseRoadMatrix(data: unknown, keys: string[]): RoadMatrix {
  if (!data || typeof data !== 'object' || !('code' in data) || data.code !== 'Ok' || !('distances' in data) || !Array.isArray(data.distances)) throw new Error('Não foi possível calcular as distâncias pelas estradas.');
  const distances = data.distances;
  if (distances.length !== keys.length || distances.some(row => !Array.isArray(row) || row.length !== keys.length || row.some(value => value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0)))) throw new Error('O serviço de rotas retornou distâncias inválidas.');
  return { keys, distances: distances.map(row => row.map((value: number | null) => value === null ? null : value / 1000)) };
}

export function roadDistance(matrix: RoadMatrix | null, from: Coordinates | null, to: Coordinates): number | null {
  if (!matrix || !from) return null;
  const source = matrix.keys.indexOf(coordinateKey(from));
  const destination = matrix.keys.indexOf(coordinateKey(to));
  return source < 0 || destination < 0 ? null : matrix.distances[source][destination];
}

// Free public tool: the community OSRM endpoint has no availability guarantee.
// Use NEXT_PUBLIC_BIKER_ROUTER_URL for a dedicated provider as usage grows.
export async function fetchRoadMatrix(points: readonly Coordinates[], signal: AbortSignal): Promise<RoadMatrix> {
  if (points.length < 2 || points.length > 100 || points.some(p => !Number.isFinite(p.lat) || !Number.isFinite(p.lng) || Math.abs(p.lat) > 90 || Math.abs(p.lng) > 180)) throw new Error('Pontos inválidos para calcular a rota.');
  const keys = points.map(coordinateKey);
  const endpoint = (process.env.NEXT_PUBLIC_BIKER_ROUTER_URL || 'https://router.project-osrm.org').replace(/\/$/, '');
  const response = await fetch(`${endpoint}/table/v1/driving/${keys.join(';')}?annotations=distance&generate_hints=false`, { signal, credentials: 'omit', referrerPolicy: 'strict-origin' });
  if (!response.ok) throw new Error('O cálculo pelas estradas está indisponível.');
  return parseRoadMatrix(await response.json(), keys);
}
