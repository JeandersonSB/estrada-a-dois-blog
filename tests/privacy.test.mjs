import assert from 'node:assert/strict';
import { test } from 'node:test';

test('withdrawal blocks Analytics, updates consent and removes only Analytics cookies', async () => {
  const jar = new Map([['_ga', 'visitor'], ['_ga_1MTMR5WVE5', 'session'], ['essential', 'keep']]);
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
    assert.equal(window[disabled], true);
    initializeAnalytics();
    assert.equal(window.dataLayer.some(command => command[0] === 'config'), false);
    assert.equal(jar.has('_ga'), false);
    assert.equal(jar.get('essential'), 'keep');

    applyAnalyticsConsent(true);
    initializeAnalytics();
    assert.equal(window[disabled], false);
    assert.equal(window.dataLayer.filter(command => command[0] === 'config').length, 1);
    assert.equal(window.dataLayer.find(command => command[0] === 'config')[2].send_page_view, false);
    assert.equal(trackPageView(), true);
    assert.equal(trackPageView(), false, 'duplicate callbacks must not send another pageview');
    assert.equal(window.dataLayer.filter(command => command[0] === 'event' && command[1] === 'page_view').length, 1);
    window.location.href = 'https://www.estradaadois.com/blog/paraguai-de-moto';
    document.title = 'Paraguai de moto';
    assert.equal(trackPageView(), true, 'client-side navigation gets a pageview');
    assert.equal(window.dataLayer.filter(command => command[0] === 'event' && command[1] === 'page_view').length, 2);

    jar.set('_ga', 'new-visitor');

    applyAnalyticsConsent(false);
    assert.equal(window[disabled], true);
    assert.equal(window.dataLayer.at(-1)[2].analytics_storage, 'denied');
    assert.equal(jar.has('_ga'), false);
    assert.equal(trackPageView(), false, 'no measurement after revoking consent');
    initializeAnalytics(); // A delayed script load must not re-enable collection.
    assert.equal(window[disabled], true);
    assert.equal(window.dataLayer.filter(command => command[0] === 'config').length, 1);

    applyAnalyticsConsent(true);
    initializeAnalytics();
    assert.equal(window[disabled], false);
    assert.equal(window.dataLayer.at(-1)[2].analytics_storage, 'granted');
    assert.equal(window.dataLayer.filter(command => command[0] === 'config').length, 1);
    assert.equal(trackPageView(), true, 'consent restored on the same page gets a new pageview');
    assert.equal(window.dataLayer.filter(command => command[0] === 'event' && command[1] === 'page_view').length, 3);
    Object.defineProperty(document, 'cookie', { configurable: true, get() { throw new Error('Cookies blocked'); } });
    assert.doesNotThrow(() => applyAnalyticsConsent(false));
    assert.equal(window[disabled], true);
  } finally {
    delete globalThis.window;
    delete globalThis.document;
  }
});

