'use client';

import { useEffect, useMemo, useState } from 'react';
import monuments from './monuments.json';
import type { Coordinates } from './helpers';
import { coordinateKey, fetchRoadMatrix, type RoadMatrix } from './roadRouting';

// Memory only: deduplicate requests across rerenders and reopening the planner.
const requests = new Map<string, Promise<RoadMatrix>>();
let nextRequestAt = 0;
function loadMatrix(points: Coordinates[], key: string) {
  const cached = requests.get(key);
  if (cached) return cached;
  const wait = Math.max(0, nextRequestAt - Date.now());
  nextRequestAt = Date.now() + wait + 1100;
  const request = new Promise<void>(resolve => window.setTimeout(resolve, wait)).then(async () => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try { return await fetchRoadMatrix(points, controller.signal); }
    finally { window.clearTimeout(timeout); }
  });
  requests.set(key, request);
  if (requests.size > 4) requests.delete(requests.keys().next().value!);
  request.catch(() => { if (requests.get(key) === request) requests.delete(key); });
  return request;
}

export function useRoadDistances(origin: Coordinates | null, enabled: boolean) {
  const lat = origin?.lat;
  const lng = origin?.lng;
  const points = useMemo(() => lat !== undefined && lng !== undefined ? [{ lat, lng }, ...monuments] : [...monuments], [lat, lng]);
  const key = points.map(coordinateKey).join(';');
  const [result, setResult] = useState<{ key: string; matrix?: RoadMatrix; error?: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    loadMatrix(points, key).then(matrix => { if (active) setResult({ key, matrix }); }, () => { if (active) setResult({ key, error: 'Não foi possível calcular pelas estradas. Tente novamente.' }); });
    return () => { active = false; };
  }, [points, key, enabled, attempt]);
  const current = result?.key === key ? result : null;
  return {
    matrix: enabled ? current?.matrix || null : null,
    loading: enabled && !current,
    error: enabled ? current?.error || '' : '',
    retry: () => { setResult(null); setAttempt(value => value + 1); },
  };
}
