'use client';

import { useEffect, useRef, useState } from 'react';

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};
const INVITE_KEY = 'ead-biker-install-invite-v1';
const INVITE_INTERVAL = 7 * 24 * 60 * 60 * 1000;

export default function InstallShortcut() {
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [ios, setIos] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [instructions, setInstructions] = useState(false);
  const [status, setStatus] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const invited = useRef(false);

  useEffect(() => {
    const display = window.matchMedia('(display-mode: standalone)');
    const screen = window.matchMedia('(max-width: 720px)');
    const isInstalled = () => display.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const updateDisplay = () => {
      setInstalled(isInstalled());
      setMobile(screen.matches);
      setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
      if (!screen.matches || isInstalled()) dialog.current?.close();
    };
    const initial = window.setTimeout(updateDisplay, 0);
    let inviteTimer: number | undefined;
    const scheduleInvite = () => {
      if (invited.current || inviteTimer !== undefined || !screen.matches || isInstalled()) return;
      try {
        const lastInvite = Number(localStorage.getItem(INVITE_KEY));
        if (lastInvite > 0 && Date.now() - lastInvite < INVITE_INTERVAL) return;
      } catch { /* The invitation still works without persistent storage. */ }
      inviteTimer = window.setTimeout(() => {
        inviteTimer = undefined;
        if (invited.current || !screen.matches || isInstalled() || document.visibilityState !== 'visible' || document.querySelector('dialog[open], [role="dialog"]')) return;
        if (!dialog.current) return;
        invited.current = true;
        try { localStorage.setItem(INVITE_KEY, String(Date.now())); } catch { /* Once per mounted page if storage is unavailable. */ }
        setInstructions(false);
        dialog.current.showModal();
      }, 15000);
    };
    const onPrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); dialog.current?.close(); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('pointerdown', scheduleInvite, { passive: true });
    window.addEventListener('keydown', scheduleInvite);
    display.addEventListener('change', updateDisplay);
    screen.addEventListener('change', updateDisplay);
    return () => {
      window.clearTimeout(initial);
      window.clearTimeout(inviteTimer);
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('pointerdown', scheduleInvite);
      window.removeEventListener('keydown', scheduleInvite);
      display.removeEventListener('change', updateDisplay);
      screen.removeEventListener('change', updateDisplay);
    };
  }, []);

  function openInvite() {
    invited.current = true;
    try { localStorage.setItem(INVITE_KEY, String(Date.now())); } catch { /* Optional preference only. */ }
    setInstructions(false);
    setStatus('');
    dialog.current?.showModal();
  }

  async function install() {
    if (installing) return;
    if (!installPrompt) { setInstructions(true); return; }
    setInstalling(true);
    setStatus('');
    dialog.current?.close();
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setStatus(choice.outcome === 'accepted' ? 'Abra a Rota Biker pelo ícone criado no seu celular.' : 'Tudo bem! Continue explorando o mapa por aqui.');
    } catch { setInstructions(true); dialog.current?.showModal(); }
    finally { setInstallPrompt(null); setInstalling(false); }
  }

  if (installed || !mobile) return null;
  return <div className="biker-install-mobile">
    <div className="biker-install-banner">
      <div><strong>Sua próxima parada, a um toque.</strong><span>Leve a Rota Biker para a tela do seu celular.</span></div>
      <button type="button" onClick={openInvite}>Instalar Rota Biker <span aria-hidden="true">↗</span></button>
    </div>
    {status && <p className="biker-install-status" role="status">{status}</p>}
    <dialog ref={dialog} className="biker-install-dialog" aria-labelledby="biker-install-title" aria-describedby="biker-install-description" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <button type="button" className="biker-install-close" aria-label="Fechar convite de instalação" onClick={() => dialog.current?.close()}>×</button>
      <div className="biker-install-symbol" aria-hidden="true"><svg width="32" height="40" viewBox="0 0 20 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="1" width="14" height="22" rx="3" /><path d="M7 5h6M8 19h4M10 9v6M7 12h6" /></svg></div>
      <span className="biker-eyebrow">PRONTA PARA A PRÓXIMA VIAGEM</span>
      <h2 id="biker-install-title">A estrada começa na sua tela inicial.</h2>
      <p id="biker-install-description">Abra o mapa com um toque, acompanhe os monumentos visitados e planeje suas próximas paradas.</p>
      {instructions ? <div className="biker-install-steps" role="status">
        <strong>Adicione o ícone ao seu celular</strong>
        {ios ? <ol><li>Abra esta página no Safari.</li><li>Toque em Compartilhar.</li><li>Escolha “Adicionar à Tela de Início” e confirme em “Adicionar”.</li></ol> : <ol><li>Abra o menu ⋮ do navegador.</li><li>Toque em “Adicionar à tela inicial” ou “Instalar app”.</li><li>Confirme para criar o ícone da Rota Biker.</li></ol>}
        <small>Se a opção não aparecer, abra esta página no navegador do celular, fora do Instagram ou WhatsApp.</small>
      </div> : <button type="button" className="biker-primary biker-install-confirm" disabled={installing} onClick={install}>{installing ? 'Abrindo instalação…' : 'Adicionar à tela inicial'}</button>}
      <button type="button" className="biker-install-later" onClick={() => dialog.current?.close()}>{instructions ? 'Entendi' : 'Agora não'}</button>
      <small className="biker-install-detail">Grátis, opcional e sem notificações. Precisa de internet.</small>
    </dialog>
  </div>;
}
