'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import monuments from './monuments.json';
import { distanceKm, rankNextStops, mapsRouteUrl, MAX_ROUTE_LOCATIONS, splitRoute, wazeUrl, type Coordinates, type RoutePoint } from './helpers';
import { findOriginPlaces, type OriginPlace } from './geocoder';

type Monument = typeof monuments[number];
export type TripPlan = {
  stopIds: string[];
  originMode: 'location' | 'address';
  originAddress: string;
  originPlace?: OriginPlace & { query: string };
  returnToStart: boolean;
};

export const emptyTripPlan: TripPlan = { stopIds: [], originMode: 'location', originAddress: '', returnToStart: false };

type Props = {
  plan: TripPlan;
  setPlan: Dispatch<SetStateAction<TripPlan>>;
  origin: Coordinates | null;
  locating: boolean;
  locationError: string;
  locationAccuracy: number | null;
  visited: string[];
  onLocate: () => void;
  onSelect: (monument: Monument) => void;
  onAdd: (monument: Monument) => void;
};

export default function RoutePlanner({ plan, setPlan, origin, locating, locationError, locationAccuracy, visited, onLocate, onSelect, onAdd }: Props) {
  const [candidate, setCandidate] = useState('');
  const [error, setError] = useState('');
  const [searchingOrigin, setSearchingOrigin] = useState(false);
  const [originSearchError, setOriginSearchError] = useState('');
  const [originResults, setOriginResults] = useState<{ query: string; places: OriginPlace[] } | null>(null);
  const originCache = useRef(new Map<string, OriginPlace[]>());
  const lastOriginSearch = useRef(0);
  const originRequest = useRef<AbortController | null>(null);
  useEffect(() => () => { originRequest.current?.abort(); originRequest.current = null; }, []);
  const stops = plan.stopIds.map(id => monuments.find(m => m.id === id)).filter((m): m is Monument => !!m);
  const limit = MAX_ROUTE_LOCATIONS - 1 - Number(plan.returnToStart);
  const confirmedOrigin = plan.originPlace?.query === plan.originAddress.trim() ? plan.originPlace : null;
  const originCoordinates = plan.originMode === 'location' ? origin : confirmedOrigin;
  const routeOrigin: RoutePoint | null = plan.originMode === 'address' ? confirmedOrigin || plan.originAddress.trim() || null : origin;
  const canNavigate = !!routeOrigin && stops.length > 0 && !(plan.originMode === 'location' && locating);
  const places = rankNextStops(monuments, plan.stopIds, originCoordinates);
  const reference = stops.at(-1) || originCoordinates;
  const referenceLabel = stops.at(-1)?.name || (plan.originMode === 'location' ? 'sua localização de partida' : confirmedOrigin?.label || 'o ponto de partida');
  const points: { label: string; value: RoutePoint }[] = routeOrigin ? [
    { label: plan.originMode === 'address' ? plan.originAddress.trim() : 'Minha localização', value: routeOrigin },
    ...stops.map(m => ({ label: m.name, value: m })),
    ...(plan.returnToStart ? [{ label: 'Volta à origem', value: routeOrigin }] : []),
  ] : [];
  const legs = splitRoute(points);

  async function locateAddress() {
    const query = plan.originAddress.trim();
    if (query.length < 3) { setOriginSearchError('Digite uma cidade ou endereço com pelo menos 3 caracteres.'); return; }
    if (searchingOrigin || Date.now() - lastOriginSearch.current < 1100) return;
    setOriginSearchError('');
    const cached = originCache.current.get(query);
    if (cached) { setOriginResults({ query, places: cached }); return; }
    lastOriginSearch.current = Date.now();
    setSearchingOrigin(true);
    const controller = new AbortController();
    originRequest.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    try {
      const results = await findOriginPlaces(query, controller.signal);
      originCache.current.set(query, results);
      setOriginResults({ query, places: results });
      if (!results.length) setOriginSearchError('Nenhum local encontrado. Inclua cidade e estado ou use sua localização.');
    } catch {
      if (originRequest.current === controller) setOriginSearchError('Não foi possível localizar a partida. Tente novamente ou use sua localização.');
    } finally {
      window.clearTimeout(timeout);
      if (originRequest.current === controller) { originRequest.current = null; setSearchingOrigin(false); }
    }
  }

  function openMaps(values: RoutePoint[]) {
    try { window.open(mapsRouteUrl(values), '_blank', 'noopener,noreferrer'); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível abrir o roteiro.'); }
  }

  function moveStop(index: number, direction: -1 | 1) {
    setPlan(current => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.stopIds.length) return current;
      const stopIds = [...current.stopIds];
      [stopIds[index], stopIds[nextIndex]] = [stopIds[nextIndex], stopIds[index]];
      return { ...current, stopIds };
    });
  }

  return <section className="biker-plan" aria-labelledby="biker-plan-title">
    <div className="biker-plan-heading"><div><span className="biker-eyebrow">UMA VIAGEM, VÁRIAS PARADAS</span><h2 id="biker-plan-title">Monte seu roteiro</h2></div><span className="biker-route-count" role="status">{1 + stops.length + Number(plan.returnToStart)} / 10 locais</span></div>
    <p>Escolha de onde sair, adicione os monumentos e organize a sequência da sua viagem.</p>
    <div className="biker-route-origin">
      <label>Partida<select value={plan.originMode} onChange={e => setPlan(current => ({ ...current, originMode: e.target.value as TripPlan['originMode'] }))}><option value="location">Minha localização atual</option><option value="address">Digitar cidade ou endereço</option></select></label>
      {plan.originMode === 'address' ? <div className="biker-address-search"><label>Cidade ou endereço de partida<input type="text" maxLength={180} value={plan.originAddress} onChange={e => { const originAddress = e.target.value; setPlan(current => ({ ...current, originAddress, originPlace: undefined })); setOriginSearchError(''); }} placeholder="Ex.: Guarapuava, PR, Brasil" /></label><button type="button" disabled={searchingOrigin || plan.originAddress.trim().length < 3} onClick={locateAddress}>{searchingOrigin ? 'Localizando partida…' : 'Localizar ponto de partida'}</button><small>Ao localizar, o texto é enviado ao serviço de busca <a href="https://photon.komoot.io/" target="_blank" rel="noopener noreferrer">Photon/Komoot</a>, com dados do OpenStreetMap. Escolha o resultado para ordenar a primeira parada.</small>{originSearchError && <p role="alert" className="biker-route-error">{originSearchError}</p>}{confirmedOrigin && <p className="biker-origin-confirmed" role="status">Partida localizada: {confirmedOrigin.label}</p>}{!confirmedOrigin && originResults?.query === plan.originAddress.trim() && originResults.places.length > 0 && <ul className="biker-origin-results" aria-label="Locais encontrados para a partida">{originResults.places.map((place, index) => <li key={index}><button type="button" onClick={() => { const query = originResults.query; setPlan(current => current.originAddress.trim() === query ? { ...current, originPlace: { ...place, query } } : current); }}>Usar {place.label}</button></li>)}</ul>}</div> : <div className="biker-origin"><strong>Minha localização atual</strong><p role="status">{locating ? 'Obtendo sua posição…' : locationError || (origin ? `Localização obtida${locationAccuracy ? ` (precisão aproximada de ${Math.round(locationAccuracy)} m)` : ''}.` : 'Use sua localização ou escolha digitar um endereço.')}</p><button type="button" disabled={locating} onClick={onLocate}>{locating ? 'Localizando…' : origin ? 'Atualizar localização' : 'Usar minha localização'}</button></div>}
    </div>
    <div className="biker-add-stop"><label>Adicionar monumento<select value={candidate} disabled={stops.length >= limit} onChange={e => setCandidate(e.target.value)}><option value="">Escolha uma parada…</option>{places.map(m => <option key={m.id} value={m.id}>{visited.includes(m.id) ? '✓ ' : ''}{m.name} — {m.city}/{m.stateCode || m.country}{m.distance !== null ? ` — ${m.distance.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km` : ''}</option>)}</select></label><button type="button" className="biker-primary" disabled={!candidate || stops.length >= limit} onClick={() => { const m = monuments.find(m => m.id === candidate); if (m) onAdd(m); setCandidate(''); }}>Adicionar parada</button></div>
    <p className="biker-next-reference" role="status">{reference ? <>Próxima parada: distâncias a partir de <strong>{referenceLabel}</strong>, da mais próxima à mais distante.</> : 'Localize a partida ou use o GPS para ordenar a primeira parada por distância. Depois, a referência será sempre o último monumento adicionado.'}</p>
    <small className="biker-distance-note">Distâncias aproximadas em linha reta entre os pontos. O Google Maps calcula o percurso pelas estradas.</small>
    <p className="biker-route-help">Até 10 locais no total, contando a origem e o destino. Adicionar uma parada não marca o monumento como visitado.</p>
    {stops.length > 0 ? <ol className="biker-route-stops" aria-label="Paradas do roteiro">{stops.map((m, index) => <li key={m.id}>
      <span className="biker-route-badge" aria-hidden="true">{index + 1}</span><button className="biker-route-place" type="button" onClick={() => onSelect(m)}><strong>{m.name}</strong><small>{m.city} · {m.stateCode || m.country}{visited.includes(m.id) ? ' · Já visitado' : ''}</small>{(index > 0 || originCoordinates) && <small className="biker-stop-distance">{distanceKm(index > 0 ? stops[index - 1] : originCoordinates!, m).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km em linha reta desde {index > 0 ? stops[index - 1].name : 'a partida'}</small>}</button>
      <div className="biker-route-actions"><button type="button" disabled={index === 0} onClick={() => moveStop(index, -1)} aria-label={`Subir ${m.name}`}>↑</button><button type="button" disabled={index === stops.length - 1} onClick={() => moveStop(index, 1)} aria-label={`Descer ${m.name}`}>↓</button><button type="button" onClick={() => setPlan(current => ({ ...current, stopIds: current.stopIds.filter(id => id !== m.id) }))} aria-label={`Remover ${m.name}`}>×</button><button type="button" onClick={() => window.open(wazeUrl(m), '_blank', 'noopener,noreferrer')} aria-label={`Navegar até ${m.name} no Waze`}>Waze ↗</button></div>
    </li>)}</ol> : <div className="biker-route-empty">Seu roteiro começa aqui. Adicione uma parada pela lista acima ou escolha um ponto no mapa.</div>}
    <label className="biker-return"><input type="checkbox" checked={plan.returnToStart} disabled={!plan.returnToStart && stops.length > 8} onChange={e => { const checked = e.target.checked; setPlan(current => ({ ...current, returnToStart: checked })); }} />Voltar ao ponto de partida depois da última parada</label>
    {stops.length > 8 && !plan.returnToStart && <small className="biker-distance-note">Para incluir a volta à origem dentro dos 10 locais, remova uma parada.</small>}
    {plan.returnToStart && <p className="biker-route-end">Destino final: {plan.originMode === 'address' ? plan.originAddress.trim() || 'endereço de partida' : 'minha localização de partida'}.</p>}
    <div className="biker-navigation"><button type="button" className="biker-primary" disabled={!canNavigate} onClick={() => openMaps(points.map(p => p.value))}>Abrir roteiro no Google Maps ↗</button>{stops.length > 0 && <button type="button" onClick={() => setPlan(current => ({ ...current, stopIds: [] }))}>Limpar paradas</button>}</div>
    {!routeOrigin && <p className="biker-route-help">Informe a partida para abrir o roteiro. Você já pode adicionar e organizar as paradas.</p>}
    {error && <p role="alert" className="biker-route-error">{error}</p>}
    {canNavigate && legs.length > 1 && <details className="biker-route-legs"><summary>Abrir por etapas, se o Maps não mostrar todas as paradas</summary><p>Alguns navegadores de celular aceitam menos paradas pelo link. Abra as etapas abaixo na sequência; o final de uma é o início da próxima.</p><ol>{legs.map((leg, index) => <li key={index}><span>Etapa {index + 1}: {leg[0].label} → {leg.at(-1)!.label}</span><button type="button" onClick={() => openMaps(leg.map(p => p.value))}>Abrir etapa {index + 1} ↗</button></li>)}</ol></details>}
    {stops.length > 0 && <p className="biker-route-help">Para usar o Waze, abra o botão da parada desejada. Ele recebe um destino por vez. Este roteiro fica nesta página enquanto você a mantém aberta.</p>}
  </section>;
}
