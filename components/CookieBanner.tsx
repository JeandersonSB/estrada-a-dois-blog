'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ANALYTICS_ID, applyAnalyticsConsent, initializeAnalytics, trackPageView } from '@/lib/analytics-consent';

const STORAGE_KEY = 'cookie-consent-v2';

type ConsentState = {
  analytics: boolean;
  updatedAt: string;
};

function readStoredConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ConsentState>;
      if (typeof parsed.analytics === 'boolean') {
        return {
          analytics: parsed.analytics,
          updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
        };
      }
    }

    if (localStorage.getItem('cookie-consent') === 'accepted') {
      const migrated: ConsentState = {
        analytics: true,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      localStorage.removeItem('cookie-consent');
      return migrated;
    }
  } catch {
    return null;
  }

  return null;
}

export function CookieBanner() {
  const pathname = usePathname();
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [analyticsChoice, setAnalyticsChoice] = useState(false);

  useEffect(() => {
    const stored = readStoredConsent();
    applyAnalyticsConsent(stored?.analytics === true);
    if (stored?.analytics === true) {
      // Queue the GA4 config and initial pageview before the async tag downloads.
      initializeAnalytics();
      trackPageView();
    }

    if (stored) {
      // Hydrate the browser-only preference after SSR, before loading Analytics.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnalyticsEnabled(stored.analytics);
      setAnalyticsChoice(stored.analytics);
    } else {
      setShowBanner(true);
    }

    const openSettings = () => {
      const current = readStoredConsent();
      setAnalyticsChoice(current?.analytics ?? false);
      setShowPreferences(true);
      setShowBanner(true);
    };

    window.addEventListener('open-cookie-settings', openSettings);
    const syncConsent = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      const current = readStoredConsent();
      applyAnalyticsConsent(current?.analytics === true);
      if (current?.analytics === true) {
        initializeAnalytics();
        trackPageView();
      }
      setAnalyticsEnabled(current?.analytics === true);
      setAnalyticsChoice(current?.analytics === true);
      if (!current) setShowBanner(true);
    };
    window.addEventListener('storage', syncConsent);
    return () => {
      window.removeEventListener('open-cookie-settings', openSettings);
      window.removeEventListener('storage', syncConsent);
    };
  }, []);

  useEffect(() => {
    // Track App Router navigations after React updates the page.
    const frame = window.requestAnimationFrame(() => trackPageView());
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  const saveConsent = (analytics: boolean) => {
    applyAnalyticsConsent(analytics);
    if (analytics) {
      initializeAnalytics();
      trackPageView();
    }
    const consent: ConsentState = {
      analytics,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
      localStorage.removeItem('cookie-consent');
    } catch { /* The choice still applies to this page when storage is blocked. */ }
    setAnalyticsEnabled(analytics);
    setAnalyticsChoice(analytics);
    setShowBanner(false);
    setShowPreferences(false);
  };

  return (
    <>
      {analyticsEnabled && (
        <Script
          id="google-analytics-loader"
          src={`https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}`}
          strategy="afterInteractive"
          onReady={() => {
            initializeAnalytics();
            trackPageView();
          }}
        />
      )}

      {showBanner && (
        <div
          className="fixed inset-x-0 bottom-0 z-[100] border-t-4 border-[#B6D200] bg-[#0F0F0F] text-[#D9D9D9] shadow-[0_-10px_30px_rgba(0,0,0,0.3)]"
          role="dialog"
          aria-label="Preferências de privacidade"
        >
          <div className="max-w-6xl mx-auto p-5 md:p-6">
            <div className="flex flex-col gap-5">
              <div>
                <p className="font-bold text-white mb-1">Sua privacidade e suas escolhas</p>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Usamos recursos essenciais para o funcionamento do site. O Google Analytics só é carregado
                  com sua autorização para entendermos, de forma agregada, como o portal é utilizado. Você pode
                  aceitar, rejeitar ou ajustar sua preferência. Consulte nossa{' '}
                  <a href="/politica-de-privacidade" className="text-[#B6D200] hover:underline">
                    Política de Privacidade
                  </a>. Rejeitar cookies opcionais não impede usar o mapa, entrar com Google ou salvar suas visitas.
                </p>
              </div>

              {showPreferences && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="font-bold text-white">Cookies de análise</p>
                      <p className="text-xs md:text-sm text-gray-400 mt-1">
                        Permite carregar o Google Analytics 4 para entender a audiência, as páginas acessadas e o desempenho
                        do portal. Não é necessário para navegar no site.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-label="Permitir Google Analytics 4"
                      aria-checked={analyticsChoice}
                      onClick={() => setAnalyticsChoice((value) => !value)}
                      className={'relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors ' + (analyticsChoice ? 'bg-[#B6D200]' : 'bg-gray-600')}
                    >
                      <span
                        className={'absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ' + (analyticsChoice ? 'translate-x-6' : 'translate-x-1')}
                      />
                    </button>
                  </div>

                  <div className="mt-4 border-t border-white/10 pt-4">
                    <p className="font-bold text-white">Armazenamento necessário ao serviço</p>
                    <p className="text-xs md:text-sm text-gray-400 mt-1">
                      Guardam sua escolha de privacidade. No mapa, o armazenamento local mantém suas marcações e o Firebase mantém a autenticação quando você escolhe entrar. Esses recursos não são desativados pela recusa ao Analytics.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => saveConsent(true)}
                  className="px-6 py-3 bg-[#B6D200] hover:bg-[#8ac200] text-[#0F0F0F] font-black uppercase tracking-wider rounded-lg transition-colors text-sm"
                >
                  Aceitar cookies
                </button>

                <button
                  type="button"
                  onClick={() => saveConsent(false)}
                  className="px-6 py-3 bg-[#B6D200] hover:bg-[#8ac200] text-[#0F0F0F] font-black uppercase tracking-wider rounded-lg transition-colors text-sm"
                >
                  Rejeitar não essenciais
                </button>

                {showPreferences ? (
                  <button
                    type="button"
                    onClick={() => saveConsent(analyticsChoice)}
                    className="px-6 py-3 border border-[#B6D200]/60 text-[#B6D200] hover:bg-[#B6D200]/10 font-bold uppercase tracking-wider rounded-lg transition-colors text-sm"
                  >
                    Salvar preferências
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPreferences(true)}
                    className="px-6 py-3 border border-white/15 text-gray-300 hover:text-white hover:bg-white/5 font-bold uppercase tracking-wider rounded-lg transition-colors text-sm"
                  >
                    Preferências
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
