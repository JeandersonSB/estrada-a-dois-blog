'use client';

import { useEffect, useState } from 'react';

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function InstallShortcut() {
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const display = window.matchMedia('(display-mode: standalone)');
    const updateDisplay = () => setInstalled(display.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    const timer = window.setTimeout(updateDisplay, 0);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    display.addEventListener('change', updateDisplay);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      display.removeEventListener('change', updateDisplay);
    };
  }, []);

  async function install() {
    if (!installPrompt || installing) return;
    setInstalling(true);
    setStatus('');
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setStatus(choice.outcome === 'accepted' ? 'Pronto! Abra a Rota Biker pelo ícone criado no seu dispositivo.' : 'Tudo bem! Você pode continuar usando o mapa por aqui.');
    } catch { setStatus('Use o menu do navegador e siga as instruções abaixo.'); }
    finally { setInstallPrompt(null); setInstalling(false); }
  }

  if (installed) return null;
  return <details className="biker-install">
    <summary><svg width="17" height="20" viewBox="0 0 20 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="1" width="14" height="22" rx="3" /><path d="M7 5h6M8 19h4M10 9v6M7 12h6" /></svg>Adicionar à tela inicial</summary>
    <div className="biker-install-content">
      <p>Tenha a Rota Biker a um toque, direto na tela do seu dispositivo.</p>
      {installPrompt && <button type="button" onClick={install} disabled={installing}>{installing ? 'Abrindo instalação…' : 'Instalar Rota Biker'}</button>}
      {status && <p role="status">{status}</p>}
      <ul>
        <li><strong>Android:</strong> no menu ⋮ do navegador, toque em “Adicionar à tela inicial” ou “Instalar app”.</li>
        <li><strong>iPhone/iPad:</strong> abra no Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.</li>
        <li><strong>Computador:</strong> no Chrome ou Edge, procure “Instalar” no menu ou na barra de endereço.</li>
      </ul>
      <small>Opcional e sem notificações. O mapa e a sincronização precisam de internet.</small>
    </div>
  </details>;
}
