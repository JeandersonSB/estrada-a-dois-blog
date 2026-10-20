'use client';
import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, LayerGroup, CircleMarker } from 'leaflet';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, deleteField } from 'firebase/firestore';
import { services } from './firebase';
import monuments from './monuments.json';
import { matchesSearch, distanceKm, mapsUrl, wazeUrl, type Coordinates } from './helpers';
import 'leaflet/dist/leaflet.css';
import './rota-biker.css';
type Monument = typeof monuments[number];
const ids = new Set(monuments.map(m => m.id));
export default function Explorer() {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef<LayerGroup | null>(null);
  const markerById = useRef<Record<string, CircleMarker>>({});
  const locationMarker = useRef<CircleMarker | null>(null);
  const [ready, setReady] = useState(false);
  const [visited, setVisited] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [syncReady, setSyncReady] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Monument | null>(null);
  const [planning, setPlanning] = useState(false);
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const filtersPanel = useRef<HTMLDetailsElement>(null);
  const privacyDialog = useRef<HTMLDialogElement>(null);
  const [destination, setDestination] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    try { const data = JSON.parse(localStorage.getItem('ead-biker-visits-v1') || '[]'); if (Array.isArray(data)) setVisited(data.filter(id => typeof id === 'string' && ids.has(id))); } catch { /* Start with empty visits. */ }
    setLoaded(true);
    const s = services();
    if (!s) return;
    return onAuthStateChanged(s.auth, u => {
      setSyncReady(false);
      if (u) setVisited([]);
      else {
        try { const local = JSON.parse(localStorage.getItem('ead-biker-visits-v1') || '[]'); setVisited(Array.isArray(local) ? local.filter(id => typeof id === 'string' && ids.has(id)) : []); } catch { setVisited([]); }
      }
      setUser(u);
    });
  }, []);
  useEffect(() => {
    if (!loaded || user) return;
    try { localStorage.setItem('ead-biker-visits-v1', JSON.stringify(visited)); } catch { setMessage('Não foi possível salvar neste navegador.'); }
  }, [visited, loaded, user]);
  useEffect(() => {
    const s = services();
    if (!user || !s) return;
    return onSnapshot(doc(s.db, 'bikerVisits', user.uid), snapshot => {
      const values = snapshot.data()?.visits || {};
      setVisited(Object.keys(values).filter(id => ids.has(id) && values[id] === true));
      setSyncReady(true);
    }, () => { setSyncReady(false); setMessage('Não foi possível sincronizar suas visitas. Tente novamente.'); });
  }, [user]);
  useEffect(() => {
    let cancelled = false;
    import('leaflet').then(L => {
      if (cancelled || !container.current) return;
      map.current = L.map(container.current).setView([-24.5, -49], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19 }).addTo(map.current);
      markers.current = L.layerGroup().addTo(map.current);
      setReady(true);
    }).catch(() => setMessage('Não foi possível carregar o mapa. Abra Filtros para consultar a lista de monumentos.'));
    return () => { cancelled = true; map.current?.remove(); map.current = null; markerById.current = {}; locationMarker.current = null; };
  }, []);
  const visible = monuments.filter(m => matchesSearch(query, [m.name, m.city, m.state, m.stateCode, m.country, ...m.keywords]) && (filter === 'all' || (filter === 'visited' ? visited.includes(m.id) : !visited.includes(m.id))));
  const nearby = origin ? monuments.map(m => ({ ...m, distance: distanceKm(origin, m) })).sort((a, b) => a.distance - b.distance || a.name.localeCompare(b.name)) : [];
  const routeDestination = monuments.find(m => m.id === destination) || null;
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    import('leaflet').then(L => {
      if (cancelled || !markers.current) return;
      const shown = new Set(visible.map(m => m.id));
      for (const [id, marker] of Object.entries(markerById.current)) {
        if (!shown.has(id)) { markers.current.removeLayer(marker); delete markerById.current[id]; }
      }
      visible.forEach(m => {
        const style = { radius: selected?.id === m.id ? 11 : 8, color: '#fff', weight: 2, fillColor: visited.includes(m.id) ? '#B6D200' : '#555', fillOpacity: 1 };
        const marker = markerById.current[m.id];
        if (marker) marker.setStyle(style).setRadius(style.radius);
        else markerById.current[m.id] = L.circleMarker([m.lat, m.lng], style).bindTooltip(`${m.name} — ${m.city}, ${m.stateCode || m.country}`).on('click', () => setSelected(m)).addTo(markers.current!);
      });
    });
    return () => { cancelled = true; };
  }, [ready, query, filter, visited, selected]); // visible is derived from these values
  useEffect(() => {
    if (!ready || !map.current || !query.trim() || !visible.length) return;
    const bounds = visible.map(m => [m.lat, m.lng] as [number, number]);
    map.current.fitBounds(bounds, { padding: [35, 35], maxZoom: 11 });
  }, [query, ready]);
  function keepMarkedVisible(next: boolean) {
    if (next && filter === 'pending') { setFilter('all'); setMessage('Visitado! Exibindo todos os pontos para manter sua marcação verde no mapa.'); }
    if (!next && filter === 'visited') setFilter('all');
  }
  useEffect(() => {
    if (!ready || !map.current) return;
    let cancelled = false;
    import('leaflet').then(L => {
      if (cancelled || !map.current) return;
      if (!origin) { locationMarker.current?.remove(); locationMarker.current = null; return; }
      if (locationMarker.current) locationMarker.current.setLatLng([origin.lat, origin.lng]);
      else locationMarker.current = L.circleMarker([origin.lat, origin.lng], { radius: 9, color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }).bindTooltip('Minha localização atual').addTo(map.current);
    });
    return () => { cancelled = true; };
  }, [origin, ready]);
  async function toggle(m: Monument) {
    if (!loaded) return;
    const next = !visited.includes(m.id);
    const s = services();
    if (user && s) {
      if (!syncReady) { setMessage('Aguarde a sincronização antes de marcar.'); return; }
      keepMarkedVisible(next);
      try { await setDoc(doc(s.db, 'bikerVisits', user.uid), { visits: { [m.id]: next ? true : deleteField() } }, { merge: true }); }
      catch { setMessage('Não foi possível salvar a marcação. Tente novamente.'); }
    } else { setVisited(current => next ? [...current, m.id] : current.filter(id => id !== m.id)); keepMarkedVisible(next); }
  }
  async function login() {
    privacyDialog.current?.close();
    const s = services();
    if (!s) { setMessage('O login Google ainda está em configuração. Suas marcações ficam salvas neste navegador.'); return; }
    try { await signInWithPopup(s.auth, new GoogleAuthProvider()); }
    catch { setMessage('Login não concluído. Você pode tentar novamente.'); }
  }
  function story() {
    const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.fillStyle = '#242323'; ctx.fillRect(0, 0, 1080, 1920);
    ctx.fillStyle = '#B6D200'; ctx.fillRect(80, 160, 120, 12);
    ctx.font = 'bold 42px sans-serif'; ctx.fillText('ESTRADA A DOIS', 80, 260);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 86px sans-serif'; ctx.fillText('MINHA ROTA', 80, 450); ctx.fillText('BIKER', 80, 555);
    ctx.fillStyle = '#B6D200'; ctx.font = 'bold 240px sans-serif'; ctx.fillText(String(visited.length), 80, 870);
    ctx.fillStyle = '#fff'; ctx.font = '40px sans-serif'; ctx.fillText(`de ${monuments.length} pontos visitados`, 80, 950);
    ctx.strokeStyle = '#777'; ctx.strokeRect(80, 1060, 920, 530);
    monuments.forEach(m => { ctx.beginPath(); ctx.fillStyle = visited.includes(m.id) ? '#B6D200' : '#666'; ctx.arc(125 + (m.lng + 55) / 21 * 830, 1100 + (-m.lat - 6) / 28 * 440, 8, 0, Math.PI * 2); ctx.fill(); });
    ctx.font = '30px sans-serif'; ctx.fillStyle = '#ddd'; ctx.fillText('Cada ponto, uma nova história.', 80, 1680); ctx.fillText('estradaadois.com/rota-biker', 80, 1770);
    canvas.toBlob(blob => { if (!blob) return; const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'meu-progresso-rota-biker.png'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
  }
  function locate(forRoute = false) {
    if (forRoute) { setOrigin(null); setLocationError(''); }
    if (!navigator.geolocation) { const error = 'Seu navegador não oferece localização. Use um navegador com localização para planejar a viagem.'; setLocationError(error); setMessage(error); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(position => {
      setOrigin({ lat: position.coords.latitude, lng: position.coords.longitude });
      setLocationAccuracy(position.coords.accuracy);
      setLocationError(''); setLocating(false);
      map.current?.setView([position.coords.latitude, position.coords.longitude], 9);
    }, error => {
      setOrigin(null); setLocationAccuracy(null); setLocating(false);
      const text = error.code === 1 ? 'Permita o acesso à localização nas configurações do navegador para usar sua posição como origem.' : 'Não foi possível obter sua posição atual. Verifique o GPS e tente novamente.';
      setLocationError(text); setMessage(text);
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
  }
  function openPlanner() {
    setPlanning(!planning);
    if (!planning) locate(true);
  }
  return <div className="biker">
    <header className="biker-intro"><div><span className="biker-eyebrow">SEU PRÓXIMO DESTINO COMEÇA AQUI</span><h1>Minha Rota Biker<span>.</span></h1><p>Marque suas visitas. Escolha as próximas paradas. Viva a estrada.</p></div><div className="biker-account">{user ? <><span>{user.displayName || 'Minha conta'}</span><button onClick={() => { const s = services(); if (s) signOut(s.auth).catch(() => setMessage('Não foi possível sair.')); }}>Sair</button></> : <button onClick={() => privacyDialog.current?.showModal()}>Entrar com Google</button>}</div></header>
    <dialog ref={privacyDialog} className="biker-privacy-dialog" aria-labelledby="biker-privacy-title" aria-describedby="biker-privacy-description">
      <h2 id="biker-privacy-title">Sua privacidade no login</h2>
      <div id="biker-privacy-description">
        <p>Para entrar e sincronizar suas visitas, o Estrada a Dois utiliza seu nome, e-mail, foto de perfil (se disponível) e identificador da conta Google, além das marcações de monumentos, com os serviços Google/Firebase.</p>
        <p>Ao aceitar, você autoriza esse tratamento para login e sincronização, conforme a LGPD. Você pode recusar e continuar usando o mapa sem login, com as marcações salvas neste navegador.</p>
      </div>
      <p className="biker-privacy-detail">Você pode solicitar a exclusão dos dados ou revogar esta autorização pelo contato indicado na <a href="/politica-de-privacidade#rota-biker" target="_blank" rel="noopener noreferrer">Política de Privacidade ↗</a>.</p>
      <div className="biker-privacy-actions"><button autoFocus onClick={() => privacyDialog.current?.close()}>Recusar</button><button className="biker-primary" onClick={login}>Aceitar e continuar</button></div>
    </dialog>
    <div className="biker-toolbar"><div><strong>{visited.length} / {monuments.length}</strong> pontos visitados <progress value={visited.length} max={monuments.length} /></div><button onClick={openPlanner} aria-expanded={planning}>Planejar viagem</button><button onClick={story}>Cartão para Stories ↓</button></div>
    <p className="biker-storage">{user ? (syncReady ? 'Marcações privadas sincronizadas com sua conta.' : 'Sincronizando sua conta…') : 'Sem login: marcações salvas apenas neste navegador. Ao entrar, será exibido o histórico da sua conta.'}</p>
    {message && <div className="biker-message" role="status">{message}<button aria-label="Fechar aviso" onClick={() => setMessage('')}>×</button></div>}
    {planning && <section className="biker-plan"><h2>Monte seu roteiro</h2><p>Saia da sua localização atual e escolha um monumento. Os destinos aparecem do mais próximo ao mais distante.</p><div className="biker-fields"><div className="biker-origin"><strong>Origem: minha localização atual</strong><p role="status">{locating ? 'Obtendo sua posição…' : locationError || (origin ? `Localização obtida${locationAccuracy ? ` (precisão aproximada de ${Math.round(locationAccuracy)} m)` : ''}. Escolha seu próximo destino!` : 'Permita o acesso à localização para continuar.')}</p><button disabled={locating} onClick={() => locate(true)}>{locating ? 'Localizando…' : 'Atualizar localização'}</button></div><label>Destino<select className={visited.includes(destination) ? 'biker-destination-visited' : ''} value={destination} disabled={!origin || locating} onChange={e => { setDestination(e.target.value); const m = monuments.find(m => m.id === e.target.value); if (m) { setSelected(m); map.current?.setView([m.lat, m.lng], 10); } }}><option value="">{origin ? 'Escolha um monumento próximo' : 'Aguardando sua localização…'}</option>{nearby.map(m => <option key={m.id} value={m.id} className={visited.includes(m.id) ? 'biker-option-visited' : ''}>{visited.includes(m.id) ? '✅ ' : ''}{m.name} — {m.city}/{m.stateCode || m.country} — {m.distance.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km</option>)}</select><small className="biker-distance-note">Distâncias aproximadas em linha reta. O aplicativo calcula a distância e o percurso pelas estradas.</small></label></div>{!locating && origin && routeDestination ? <div className="biker-navigation"><a className="biker-primary" href={mapsUrl(origin, routeDestination)} target="_blank" rel="noopener noreferrer">Abrir no Google Maps ↗</a><a className="biker-primary" href={wazeUrl(routeDestination)} target="_blank" rel="noopener noreferrer">Abrir no Waze ↗</a></div> : <p>Autorize sua localização e selecione um destino para navegar.</p>}</section>}
    <div className="biker-workspace">
      <div className="biker-map-tools">
        <label className="biker-search">Buscar monumento<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Nome, cidade, estado ou número…" /></label>
        <details className="biker-filters" ref={filtersPanel}>
          <summary aria-label="Abrir filtros e lista de monumentos"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 5h16M7 12h10M10 19h4"/><circle cx="9" cy="5" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/></svg><span>Filtros</span>{filter !== 'all' && <i aria-label="Filtro ativo" />}</summary>
          <div className="biker-filter-panel"><div className="biker-filter-heading"><strong>Filtrar monumentos</strong><button onClick={() => { if (filtersPanel.current) filtersPanel.current.open = false; }} aria-label="Fechar filtros">×</button></div><label className="biker-search">Mostrar<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Todos os pontos</option><option value="visited">Já visitados</option><option value="pending">Ainda não visitei</option></select></label><p className="biker-result" role="status">{visible.length} pontos encontrados</p><div className="biker-list">{visible.map(m => <button key={m.id} className={[selected?.id === m.id ? 'active' : '', visited.includes(m.id) ? 'biker-row-visited' : ''].filter(Boolean).join(' ')} onClick={() => { setSelected(m); map.current?.setView([m.lat, m.lng], 12); if (filtersPanel.current) filtersPanel.current.open = false; }}><span className={visited.includes(m.id) ? 'biker-dot visited' : 'biker-dot'} /><span>{visited.includes(m.id) && <span className="biker-visited-check" aria-label="Visitado">✅ </span>}{m.name}<small>{m.city} · {m.stateCode || m.country} — {visited.includes(m.id) ? 'Já visitei' : 'Quero conhecer'}</small></span><span>↗</span></button>)}{!visible.length && <p>Nenhum ponto encontrado.</p>}</div></div>
        </details>
      </div>
      <div className="biker-map-wrap"><div ref={container} className="biker-map" aria-label="Mapa interativo dos pontos da Rota Biker" /><button className="biker-locate" disabled={locating} onClick={() => locate()}>◎ {locating ? 'Localizando…' : 'Minha localização'}</button><div className="biker-legend">● Pendente <span>● Visitado</span>{origin && <span className="biker-user-location">● Você</span>}</div></div>
    </div>
    {selected && <section className={`biker-selected${visited.includes(selected.id) ? ' biker-selected-visited' : ''}`}><div><span className="biker-eyebrow">PONTO SELECIONADO</span><h2>{visited.includes(selected.id) && <span className="biker-visited-check" aria-label="Visitado">✅ </span>}{selected.name}</h2><p>{selected.city} · {selected.state || selected.country} · Monumento {selected.number}</p></div><button className="biker-primary" disabled={!loaded || (!!user && !syncReady)} onClick={() => toggle(selected)}>{visited.includes(selected.id) ? '✓ Visitado — desmarcar' : 'Marcar como visitado'}</button><a href={`https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lng}`} target="_blank" rel="noopener noreferrer">Como chegar ↗</a></section>}
    <footer className="biker-note"><p>Pontos importados do <a href="https://www.google.com/maps/d/viewer?mid=1ZHPck3Yykbhc8M1GYPrCcKf5pajiTvk" target="_blank" rel="noopener noreferrer">mapa de referência Rota Bikers</a> em 19/10/2026. Confira acesso e funcionamento antes de viajar.</p><p>Este mapa é uma ferramenta independente do Estrada a Dois, criada para ajudar cada viajante a manter seu controle online dos monumentos que já visitou. Os direitos sobre a Rota Biker, sua marca e identidade pertencem aos seus respectivos idealizadores e titulares. Como participante e divulgador do movimento, o Estrada a Dois quer contribuir, somar e facilitar a vida de quem vive a estrada. Esta página não é um serviço oficial da Rota Biker e suas marcações não substituem o passaporte físico nem validam carimbos ou conquistas oficiais.</p></footer>
  </div>;
}
