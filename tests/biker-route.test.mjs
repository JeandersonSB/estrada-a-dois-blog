import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mapsRouteUrl, mapsUrl, splitRoute, MAX_ROUTE_LOCATIONS } from '../app/rota-biker/helpers.ts';

const stops = Array.from({ length: 9 }, (_, index) => ({ lat: -25 + index / 10, lng: -51 + index / 10 }));
const text = point => typeof point === 'string' ? point : `${point.lat},${point.lng}`;

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
