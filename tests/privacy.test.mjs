import assert from 'node:assert/strict';
import { test } from 'node:test';

test('advanced consent measures page views without analytics cookies, with optional consent', async () => {
  const jar = new Map([['_ga', 'old-visitor'], ['_ga_1MTMR5WVE5', 'session'], ['essential', 'keep']]);
  globalThis.window = { location: { hostname: 'www.estradaadois.com', href: 'https://www.estradaadois.com/' } };
  globalThis.document = {
    title: 'Estrada a Dois | Home',
    get cookie() { return [...jar].map(([key, value]) => `${key}=${value}`).join('; '); },
    set cookie(value) { if (value.includes('Max-Age=0')) jar.delete(value.split('=')[0]); },
  };
  try {
    const { ANALYTICS_ID, applyAnalyticsConsent, initializeAnalytics, trackPageView } = await import('../lib/analytics-consent.ts');
    const disabled = `ga-disable-${ANALYTICS_ID}`;
    applyAnalyticsConsent(false);
    assert.equal(window[disabled], false, 'legacy hard opt-out must not block cookieless pings');
    assert.equal(jar.has('_ga'), false, 'consent denial removes analytics cookies');
    assert.equal(jar.get('essential'), 'keep', 'unrelated cookies remain');
    assert.equal(window.dataLayer[0][0], 'consent');
    assert.equal(window.dataLayer[0][1], 'default');
    assert.equal(window.dataLayer[0][2].analytics_storage, 'denied');
    assert.equal(window.dataLayer[1][1], 'update');
    assert.equal(window.dataLayer[1][2].analytics_storage, 'denied');

    initializeAnalytics();
    const configs = () => window.dataLayer.filter(cmd => cmd[0] === 'config');
    const pageviews = () => window.dataLayer.filter(cmd => cmd[0] === 'event' && cmd[1] === 'page_view');
    assert.equal(configs().length, 1);
    assert.equal(configs()[0][2].send_page_view, false);
    assert.equal(configs()[0][2].allow_google_signals, false);
    assert.equal(trackPageView(), true, 'unconsented visitors still count by cookieless event');
    assert.equal(pageviews().length, 1);
    assert.equal(trackPageView(), false, 'same page cannot count twice');
    assert.equal(jar.has('_ga'), false);

    applyAnalyticsConsent(true);
    assert.equal(window.dataLayer.at(-1)[2].analytics_storage, 'granted');
    initializeAnalytics();
    assert.equal(configs().length, 1, 'config initialized only once');
    assert.equal(trackPageView(), false, 'accepting cookies must not duplicate the same visit');

    window.location.href = 'https://www.estradaadois.com/blog/paraguai-de-moto';
    document.title = 'Paraguai de moto';
    assert.equal(trackPageView(), true, 'App Router navigation is measured');
    assert.equal(pageviews().length, 2);

    jar.set('_ga', 'visitor');
    applyAnalyticsConsent(false);
    assert.equal(window.dataLayer.at(-1)[2].analytics_storage, 'denied');
    assert.equal(jar.has('_ga'), false, 'withdrawal removes analytics cookies');
    assert.equal(trackPageView(), false, 'withdrawal does not duplicate a page');
    window.location.href = 'https://www.estradaadois.com/rota-biker';
    assert.equal(trackPageView(), true, 'future navigations remain measurable without cookies');
    assert.equal(pageviews().length, 3);
    assert.equal(jar.get('essential'), 'keep');
    Object.defineProperty(document, 'cookie', { configurable: true, get() { throw new Error('Cookies blocked'); } });
    assert.doesNotThrow(() => applyAnalyticsConsent(false));
  } finally {
    delete globalThis.window;
    delete globalThis.document;
  }
});
