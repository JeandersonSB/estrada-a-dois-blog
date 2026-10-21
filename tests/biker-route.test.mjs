import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mapsRouteUrl, mapsUrl, splitRoute, MAX_ROUTE_LOCATIONS, rankNextStops } from '../app/rota-biker/helpers.ts';

import { parseRoadMatrix, roadDistance, fetchRoadMatrix, coordinateKey } from '../app/rota-biker/roadRouting.ts';

const stops = Array.from({ length: 9 }, (_, index) => ({ lat: -25 + index / 10, lng: -51 + index / 10 }));
const text = point => typeof point === 'string' ? point : `${point.lat},${point.lng}`;

test('road ranking follows each last stop, puts visited last, and keeps unknown routes last in each group', () => {
  const origin = { lat: 0, lng: 0 };
  const catalog = [
    { id: 'a', name: 'A', lat: 0, lng: 1 },
    { id: 'b', name: 'B', lat: 0, lng: 2 },
    { id: 'c', name: 'C', lat: 0, lng: 3 },
    { id: 'd', name: 'D', lat: 0, lng: 4 },
  ];
  // Roads are directional and can make a geographically closer place farther away.
  const matrix = parseRoadMatrix({ code: 'Ok', distances: [
    [0, 40000, 20000, 5000, null],
    [41000, 0, 9000, 16000, 2000],
    [21000, 3000, 0, 10000, 8000],
    [6000, 50000, 17000, 0, 1000],
    [null, 4000, 8000, 3000, 0],
  ] }, [origin, ...catalog].map(coordinateKey));
  const rank = (ids, visited = []) => {
    const reference = catalog.find(m => m.id === ids.at(-1)) || origin;
    return rankNextStops(catalog, ids, Object.fromEntries(catalog.map(m => [m.id, roadDistance(matrix, reference, m)])), visited);
  };
  assert.deepEqual(rank([]).map(m => m.id), ['c', 'b', 'a', 'd']);
  assert.deepEqual(rank([], ['c']).map(m => m.id), ['b', 'a', 'd', 'c']);
  assert.deepEqual(rank(['c']).map(m => m.id), ['d', 'b', 'a']);
  assert.equal(rank(['c'])[0].distance, 1);
  assert.equal(rank(['a'])[0].id, 'd');
  assert.equal(rank(['b'])[0].id, 'a');
  assert.equal(rank(['c', 'a'])[0].id, 'd');
  assert.equal(rank(['a', 'c'])[0].id, 'd');
  assert.equal(rank(['b', 'a'])[0].distance, 2);
  assert.equal(rank(['a', 'b'])[0].id, 'd');
  assert.equal(roadDistance(matrix, catalog[0], catalog[1]), 9);
  assert.equal(roadDistance(matrix, catalog[1], catalog[0]), 3);
  assert.equal(roadDistance(matrix, origin, catalog[3]), null);
  assert.equal(roadDistance(null, origin, catalog[0]), null);
  assert.equal(rankNextStops(catalog, [], {}, ['a']).at(-1).id, 'a');
});

test('road responses reject failures and malformed distances instead of falling back to straight lines', () => {
  for (const data of [{ code: 'NoTable' }, { code: 'Ok', distances: [[0]] }, { code: 'Ok', distances: [[0, -1], [1, 0]] }, { code: 'Ok', distances: [[0, '12'], [1, 0]] }]) {
    assert.throws(() => parseRoadMatrix(data, ['a', 'b']));
  }
});

test('routing request uses driving distances in longitude,latitude order with no geometric fallback', async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url: new URL(url), options };
    return { ok: true, json: async () => ({ code: 'Ok', distances: [[0, 128000], [129000, 0]] }) };
  };
  try {
    const matrix = await fetchRoadMatrix(stops.slice(0, 2), new AbortController().signal);
    assert.equal(matrix.distances[0][1], 128);
    assert.match(request.url.pathname, /table\/v1\/driving\/-51,-25;-50.9,-24.9$/);
    assert.equal(request.url.searchParams.get('annotations'), 'distance');
    assert.equal(request.url.searchParams.has('fallback_speed'), false);
    assert.equal(request.options.credentials, 'omit');
    globalThis.fetch = async () => ({ ok: false });
    await assert.rejects(() => fetchRoadMatrix(stops.slice(0, 2), new AbortController().signal));
  } finally { globalThis.fetch = originalFetch; }
});

test('ten locations keep the chosen origin, all eight waypoints and final destination', () => {
  const points = ['Guarapuava, PR, Brasil', ...stops];
  const url = new URL(mapsRouteUrl(points));
  assert.equal(MAX_ROUTE_LOCATIONS, 10);
  assert.equal(url.searchParams.get('origin'), points[0]);
  assert.equal(url.searchParams.get('destination'), text(stops[8]));
  assert.deepEqual(url.searchParams.get('waypoints').split('|'), stops.slice(0, 8).map(text));
  assert.equal(url.searchParams.get('api'), '1');
  assert.equal(url.searchParams.get('travelmode'), 'driving');
  assert.ok(url.href.length <= 2048);
});

test('return to the origin preserves every stop and uses the origin as final destination', () => {
  const origin = { lat: -25.39, lng: -51.46 };
  const url = new URL(mapsRouteUrl([origin, ...stops.slice(0, 8), origin]));
  assert.equal(url.searchParams.get('destination'), text(origin));
  assert.deepEqual(url.searchParams.get('waypoints').split('|'), stops.slice(0, 8).map(text));
});

test('mobile stages preserve the entire order, overlapping only their boundary points', () => {
  const points = ['Guarapuava', ...stops];
  const legs = splitRoute(points);
  assert.equal(legs.length, 3);
  assert.deepEqual([legs[0][0], ...legs.flatMap(leg => leg.slice(1))], points);
  legs.forEach((leg, index) => {
    assert.ok(leg.length >= 2 && leg.length <= 5);
    if (index) assert.equal(leg[0], legs[index - 1].at(-1));
    const url = new URL(mapsRouteUrl(leg));
    assert.ok((url.searchParams.get('waypoints')?.split('|').length || 0) <= 3);
  });
});

test('one destination remains compatible and input cannot add URL parameters', () => {
  assert.equal(mapsUrl(stops[0], stops[1]), mapsRouteUrl(stops.slice(0, 2)));
  const address = 'Rua São João, 20 & destination=outro?x=1';
  const url = new URL(mapsRouteUrl([address, stops[0]]));
  assert.equal(url.searchParams.get('origin'), address);
  assert.equal(url.searchParams.get('destination'), text(stops[0]));
  assert.equal(url.searchParams.has('waypoints'), false);
});

test('invalid or excessive locations are rejected rather than silently losing stops', () => {
  assert.throws(() => mapsRouteUrl(['Origem', ...stops, stops[0]]));
  assert.throws(() => mapsRouteUrl(['   ', stops[0]]));
  assert.throws(() => mapsRouteUrl([{ lat: NaN, lng: 0 }, stops[0]]));
  assert.throws(() => mapsRouteUrl([{ lat: 91, lng: 0 }, stops[0]]));
  assert.throws(() => mapsRouteUrl([stops[0]]));
  assert.deepEqual(splitRoute([]), []);
});
