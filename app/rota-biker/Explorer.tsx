'use client';
import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, LayerGroup } from 'leaflet';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, deleteField } from 'firebase/firestore';
import { services } from './firebase';
import monuments from './monuments.json';
import 'leaflet/dist/leaflet.css';
import './rota-biker.css';
type Monument = typeof monuments[number];
const ids = new Set(monuments.map(m => m.id));
export default function Explorer() {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef<LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const [visited, setVisited] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [syncReady, setSyncReady] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Monument | null>(null);
  const [stops, setStops] = useState<string[]>([]);
  const [planning, setPlanning] = useState(false);
  const [origin, setOrigin] = useState('');
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
    }).catch(() => setMessage('Não foi possível carregar o mapa. Use a lista de monumentos abaixo.'));
    return () => { cancelled = true; map.current?.remove(); map.current = null; };
  }, []);
  const visible = monuments.filter(m => m.name.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')) && (filter === 'all' || (filter === 'visited' ? visited.includes(m.id) : !visited.includes(m.id))));
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    import('leaflet').then(L => {
      if (cancelled || !markers.current) return;
      markers.current.clearLayers();
      visible.forEach(m => L.circleMarker([m.lat, m.lng], { radius: stops.includes(m.id) ? 11 : 8, color: '#fff', weight: 2, fillColor: stops.includes(m.id) ? '#6554c0' : visited.includes(m.id) ? '#14845a' : '#555', fillOpacity: 1 }).bindTooltip(m.name).on('click', () => setSelected(m)).addTo(markers.current!));
    });
    return () => { cancelled = true; };
  }, [ready, query, filter, visited, stops]); // visible is derived from these values
  async function toggle(m: Monument) {
    if (!loaded) return;
    const next = !visited.includes(m.id);
    const s = services();
    if (user && s) {
      if (!syncReady) { setMessage('Aguarde a sincronização antes de marcar.'); return; }
      try { await setDoc(doc(s.db, 'bikerVisits', user.uid), { visits: { [m.id]: next ? true : deleteField() } }, { merge: true }); }
      catch { setMessage('Não foi possível salvar a marcação. Tente novamente.'); }
    } else setVisited(current => next ? [...current, m.id] : current.filter(id => id !== m.id));
  }
  async function login() {
    const s = services();
    if (!s) { setMessage('O login Google ainda está em configuração. Suas marcações ficam salvas neste navegador.'); return; }
    try { await signInWithPopup(s.auth, new GoogleAuthProvider()); }
    catch { setMessage('Login não concluído. Você pode tentar novamente.'); }
  }
  function addStop(m: Monument) {
    if (stops.includes(m.id)) setStops(stops.filter(id => id !== m.id));
    else if (stops.length < 3) setStops([...stops, m.id]);
    else setMessage('Use até 3 paradas por roteiro para abrir também no Google Maps do celular.');
  }
  function route() {
    const params = new URLSearchParams({ api: '1', origin, destination, travelmode: 'driving' });
    if (stops.length) params.set('waypoints', stops.map(id => { const m = monuments.find(m => m.id === id)!; return `${m.lat},${m.lng}`; }).join('|'));
    return `https://www.google.com/maps/dir/?${params}`;
  }
  function story() {
    const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.fillStyle = '#242323'; ctx.fillRect(0, 0, 1080, 1920);
    ctx.fillStyle = '#ffff01'; ctx.fillRect(80, 160, 120, 12);
    ctx.font = 'bold 42px sans-serif'; ctx.fillText('ESTRADA A DOIS', 80, 260);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 86px sans-serif'; ctx.fillText('MINHA ROTA', 80, 450); ctx.fillText('BIKER', 80, 555);
    ctx.fillStyle = '#ffff01'; ctx.font = 'bold 240px sans-serif'; ctx.fillText(String(visited.length), 80, 870);
    ctx.fillStyle = '#fff'; ctx.font = '40px sans-serif'; ctx.fillText(`de ${monuments.length} pontos visitados`, 80, 950);
    ctx.strokeStyle = '#777'; ctx.strokeRect(80, 1060, 920, 530);
    monuments.forEach(m => { ctx.beginPath(); ctx.fillStyle = visited.includes(m.id) ? '#ffff01' : '#666'; ctx.arc(125 + (m.lng + 55) / 21 * 830, 1100 + (-m.lat - 6) / 28 * 440, 8, 0, Math.PI * 2); ctx.fill(); });
    ctx.font = '30px sans-serif'; ctx.fillStyle = '#ddd'; ctx.fillText('Cada ponto, uma nova história.', 80, 1680); ctx.fillText('estradaadois.com/rota-biker', 80, 1770);
    canvas.toBlob(blob => { if (!blob) return; const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'meu-progresso-rota-biker.png'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
  }
  function locate() {
    if (!navigator.geolocation) { setMessage('Seu navegador não oferece localização.'); return; }
    navigator.geolocation.getCurrentPosition(position => { map.current?.setView([position.coords.latitude, position.coords.longitude], 9); }, () => setMessage('Não foi possível acessar sua localização. Verifique a permissão do navegador.'));
  }
  return <div className="biker">
    <header className="biker-intro"><div><span className="biker-eyebrow">SEU PRÓXIMO DESTINO COMEÇA AQUI</span><h1>Minha Rota Biker<span>.</span></h1><p>Marque suas visitas. Escolha as próximas paradas. Viva a estrada.</p></div><div className="biker-account">{user ? <><span>{user.displayName || 'Minha conta'}</span><button onClick={() => { const s = services(); if (s) signOut(s.auth).catch(() => setMessage('Não foi possível sair.')); }}>Sair</button></> : <button onClick={login}>Entrar com Google</button>}</div></header>
    <div className="biker-toolbar"><div><strong>{visited.length} / {monuments.length}</strong> pontos visitados <progress value={visited.length} max={monuments.length} /></div><button onClick={() => setPlanning(!planning)} aria-expanded={planning}>Planejar viagem</button><button onClick={story}>Cartão para Stories ↓</button></div>
    <p className="biker-storage">{user ? (syncReady ? 'Marcações privadas sincronizadas com sua conta.' : 'Sincronizando sua conta…') : 'Sem login: marcações salvas apenas neste navegador. Ao entrar, será exibido o histórico da sua conta.'}</p>
    {message && <div className="biker-message" role="status">{message}<button aria-label="Fechar aviso" onClick={() => setMessage('')}>×</button></div>}
    {planning && <section className="biker-plan"><h2>Monte seu roteiro</h2><p>Informe a saída e a chegada. Adicione até 3 monumentos na ordem em que deseja visitar. O Google Maps calcula o percurso.</p><div className="biker-fields"><label>Origem<input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="Ex.: Guarapuava, PR" /></label><label>Destino<input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Ex.: Urubici, SC" /></label></div><ol>{stops.map((id, i) => <li key={id}>{i + 1}. {monuments.find(m => m.id === id)?.name} <button onClick={() => setStops(stops.filter(s => s !== id))} aria-label="Remover parada">×</button></li>)}</ol>{origin.trim() && destination.trim() ? <a className="biker-primary" href={route()} target="_blank" rel="noopener noreferrer">Abrir roteiro no Google Maps ↗</a> : <p>Preencha origem e destino para abrir o roteiro.</p>}</section>}
    <div className="biker-workspace"><aside><label className="biker-search">Buscar monumento<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Nome do local…" /></label><label className="biker-search">Mostrar<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Todos os pontos</option><option value="visited">Já visitados</option><option value="pending">Ainda não visitei</option></select></label><p className="biker-result">{visible.length} pontos encontrados</p><div className="biker-list">{visible.map(m => <button key={m.id} className={selected?.id === m.id ? 'active' : ''} onClick={() => { setSelected(m); map.current?.setView([m.lat, m.lng], 12); }}><span className={visited.includes(m.id) ? 'biker-dot visited' : 'biker-dot'} /><span>{m.name}<small>{visited.includes(m.id) ? 'Já visitei' : 'Quero conhecer'}</small></span><span>↗</span></button>)}{!visible.length && <p>Nenhum ponto encontrado.</p>}</div></aside><div className="biker-map-wrap"><div ref={container} className="biker-map" aria-label="Mapa interativo dos pontos da Rota Biker" /><button className="biker-locate" onClick={locate}>◎ Minha localização</button><div className="biker-legend">● Pendente <span>● Visitado</span></div></div></div>
    {selected && <section className="biker-selected"><div><span className="biker-eyebrow">PONTO SELECIONADO</span><h2>{selected.name}</h2></div><button className="biker-primary" disabled={!loaded || (!!user && !syncReady)} onClick={() => toggle(selected)}>{visited.includes(selected.id) ? '✓ Visitado — desmarcar' : 'Marcar como visitado'}</button>{planning && <button onClick={() => addStop(selected)}>{stops.includes(selected.id) ? 'Remover do roteiro' : 'Adicionar ao roteiro'}</button>}<a href={`https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lng}`} target="_blank" rel="noopener noreferrer">Como chegar ↗</a></section>}
    <footer className="biker-note">Pontos importados do <a href="https://www.google.com/maps/d/viewer?mid=1ZHPck3Yykbhc8M1GYPrCcKf5pajiTvk" target="_blank" rel="noopener noreferrer">mapa de referência Rota Bikers</a> em 19/10/2026. Confira acesso e funcionamento antes de viajar. Ferramenta independente do Estrada a Dois.</footer>
  </div>;
}
