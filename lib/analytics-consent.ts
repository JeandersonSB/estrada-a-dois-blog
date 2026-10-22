export const ANALYTICS_ID = 'G-1MTMR5WVE5';
const DISABLED_KEY = `ga-disable-${ANALYTICS_ID}` as const;

type AnalyticsWindow = Window & {
  dataLayer?: unknown[][];
  gtag?: (...args: unknown[]) => void;
  [DISABLED_KEY]?: boolean;
};

let initialized = false;
let lastPageViewUrl: string | null = null;

function analyticsWindow() {
  const target = window as AnalyticsWindow;
  target.dataLayer ??= [];
  if (!target.gtag) {
    target.gtag = (...args: unknown[]) => { target.dataLayer!.push(args); };
    target.gtag('consent', 'default', {
      analytics_storage: 'denied', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied',
    });
  }
  return target;
}

function clearAnalyticsCookies() {
  let cookies: string;
  try { cookies = document.cookie; } catch { return; }
  const names = cookies.split(';').map(cookie => cookie.trim().split('=')[0])
    .filter(name => /^(_ga(?:_|$)|_gid$|_gat(?:_|$))/.test(name));
  const labels = window.location.hostname.split('.');
  const domains = ['', ...labels.map((_, index) => labels.slice(index).join('.')).filter(domain => domain.includes('.'))];
  for (const name of names) {
    for (const domain of domains) {
      try {
        document.cookie = `${name}=; Max-Age=0; Path=/${domain ? `; Domain=${domain}` : ''}; SameSite=Lax`;
      } catch { /* The opt-out flag still blocks Analytics if cookies are unavailable. */ }
    }
  }
}

export function applyAnalyticsConsent(allowed: boolean) {
  if (typeof window === 'undefined') return;
  const target = analyticsWindow();
  // Advanced Consent Mode: denial prevents analytics cookies, not aggregate cookieless pings.
  // Clear a legacy ga-disable flag left by the previous basic-consent implementation.
  target[DISABLED_KEY] = false;
  target.gtag!('consent', 'update', {
    analytics_storage: allowed ? 'granted' : 'denied', ad_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied',
  });
  if (!allowed) {
    clearAnalyticsCookies();
  }
}

export function initializeAnalytics() {
  const target = analyticsWindow();
  // The GA4 tag is configured for every visitor, with analytics_storage denied by default.
  if (initialized) return;
  target.gtag!('js', new Date());
  target.gtag!('config', ANALYTICS_ID, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  initialized = true;
}

// Page views are sent for every visitor. Under denied consent, GA4 receives
// cookieless pings instead of writing/reading analytics cookies.
// Deduplicate callbacks for the same URL, including consent transitions.
export function trackPageView() {
  if (typeof window === 'undefined' || !initialized) return false;
  const target = window as AnalyticsWindow;
  if (typeof target.gtag !== 'function') return false;
  const url = window.location.href.split('#')[0];
  if (url === lastPageViewUrl) return false;
  target.gtag('event', 'page_view', {
    send_to: ANALYTICS_ID,
    page_location: url,
    page_title: document.title,
  });
  lastPageViewUrl = url;
  return true;
}
