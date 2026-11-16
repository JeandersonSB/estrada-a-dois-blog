'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { SmartImage } from '@/components/SmartImage';

export type HeroStat = { value: string; label: string };

export type HeroSlide = {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  stats: HeroStat[];
};

export type RoadItem = {
  slug: string;
  title: string;
  image: string;
  label: string;
};

const SLIDE_MS = 7500;

/**
 * Destaque da página inicial: carrossel das viagens mais recentes (troca
 * sozinho, setas, barras de tempo, pausa ao passar o mouse e arraste no
 * celular) + faixa "estrada" com os demais artigos em movimento contínuo.
 */
export function HomeHero({ slides, road }: { slides: HeroSlide[]; road: RoadItem[] }) {
  const [current, setCurrent] = useState(0);
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const paused = useRef(false);
  const elapsed = useRef(0);
  const startedAt = useRef(0);
  const touchX = useRef<number | null>(null);
  const total = slides.length;

  const goTo = useCallback((index: number) => {
    elapsed.current = 0;
    startedAt.current = performance.now();
    setCurrent(((index % total) + total) % total);
  }, [total]);

  useEffect(() => {
    fillRefs.current.forEach((el, i) => {
      if (el) el.style.width = i < current ? '100%' : '0%';
    });
  }, [current]);

  useEffect(() => {
    if (total < 2) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    startedAt.current = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      if (!paused.current && !document.hidden) {
        const progress = Math.min(1, (elapsed.current + now - startedAt.current) / SLIDE_MS);
        const bar = fillRefs.current[current];
        if (bar) bar.style.width = `${progress * 100}%`;
        if (progress >= 1 && !reduceMotion) {
          goTo(current + 1);
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [current, total, goTo]);

  const pause = () => {
    if (paused.current) return;
    paused.current = true;
    elapsed.current += performance.now() - startedAt.current;
  };
  const resume = () => {
    if (!paused.current) return;
    paused.current = false;
    startedAt.current = performance.now();
  };

  if (total === 0) return null;
  const roadLoop = road.length > 0 ? [...road, ...road] : [];

  return (
    <section className="bg-[#1C1C1C] pt-6 md:pt-8 pb-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div
          role="region"
          aria-roledescription="carrossel"
          aria-label="Nossas viagens mais recentes"
          className="relative"
          onMouseEnter={pause}
          onMouseLeave={resume}
          onFocus={pause}
          onBlur={resume}
          onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const delta = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(delta) > 40) goTo(current + (delta < 0 ? 1 : -1));
            touchX.current = null;
          }}
        >
          {total > 1 && (
            <div className="flex gap-2 mb-5">
              {slides.map((slide, i) => (
                <button
                  key={slide.slug}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Ir para: ${slide.title}`}
                  aria-current={i === current}
                  className="flex-1 h-4 flex items-center cursor-pointer"
                >
                  <span className="block w-full h-1 rounded bg-white/20 overflow-hidden">
                    <span ref={(el) => { fillRefs.current[i] = el; }} className="block h-full w-0 bg-[#9FD131]" />
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="grid">
            {slides.map((slide, i) => {
              const active = i === current;
              return (
                <article
                  key={slide.slug}
                  aria-hidden={!active}
                  inert={!active}
                  className={`[grid-area:1/1] grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-5 lg:gap-9 items-center transition-opacity duration-700 ${active ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                  <Link
                    href={`/blog/${slide.slug}`}
                    tabIndex={active ? 0 : -1}
                    className="relative block h-[240px] sm:h-[320px] lg:h-[450px] rounded-2xl overflow-hidden bg-black"
                  >
                    <SmartImage
                      src={slide.image}
                      alt={slide.title}
                      priority={i === 0}
                      sizes="(min-width: 1024px) 600px, calc(100vw - 32px)"
                      className={`object-cover ${active ? 'ead-kenburns' : ''}`}
                    />
                  </Link>

                  <div className={`text-white ${active ? 'ead-stagger' : ''}`}>
                    <span className="inline-block bg-[#9FD131] text-[#1C1C1C] text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
                      {i === 0 ? 'Última viagem' : 'Roteiro real'}
                    </span>
                    <h2 className="mt-4 mb-3 text-[28px] md:text-[40px] font-black leading-[1.08] line-clamp-3">
                      <Link href={`/blog/${slide.slug}`} tabIndex={active ? 0 : -1} className="hover:text-[#9FD131] transition-colors">
                        {slide.title}
                      </Link>
                    </h2>
                    <p className="text-gray-300 text-base md:text-[17px] leading-relaxed line-clamp-3">{slide.excerpt}</p>
                    {slide.stats.length > 0 && (
                      <dl className="flex flex-wrap gap-x-6 gap-y-3 my-5">
                        {slide.stats.map((stat) => (
                          <div key={stat.label} className="border-l-[3px] border-[#9FD131] pl-2.5">
                            <dt className="sr-only">{stat.label}</dt>
                            <dd className="text-lg md:text-[22px] font-black leading-tight">{stat.value}</dd>
                            <dd aria-hidden="true" className="text-[11px] text-[#B5B5B0] uppercase tracking-wider">{stat.label}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    <div className={`flex flex-wrap items-center gap-4 ${slide.stats.length > 0 ? '' : 'mt-5'}`}>
                      <Link
                        href={`/blog/${slide.slug}`}
                        tabIndex={active ? 0 : -1}
                        className="inline-flex rounded-xl bg-[#9FD131] px-5 py-3 font-black text-[#1C1C1C] hover:bg-white transition-colors"
                      >
                        Ler o roteiro →
                      </Link>
                      <time dateTime={slide.date} className="text-sm font-bold text-[#B5B5B0]">{slide.date}</time>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {total > 1 && (
            <div className="flex items-center justify-end gap-2.5 mt-4 lg:mt-0 lg:absolute lg:right-0 lg:bottom-0 z-20">
              <span className="text-sm font-bold text-[#B5B5B0] mr-1" aria-live="polite">
                {current + 1} / {total}
              </span>
              <button
                type="button"
                onClick={() => goTo(current - 1)}
                aria-label="Viagem anterior"
                className="w-11 h-11 rounded-full border-2 border-[#3a3a38] bg-[#262626] text-white text-lg hover:border-[#9FD131] hover:text-[#9FD131] transition-colors"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => goTo(current + 1)}
                aria-label="Próxima viagem"
                className="w-11 h-11 rounded-full border-2 border-[#3a3a38] bg-[#262626] text-white text-lg hover:border-[#9FD131] hover:text-[#9FD131] transition-colors"
              >
                →
              </button>
            </div>
          )}
        </div>

        {roadLoop.length > 0 && (
          <div className="mt-9">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[#9FD131] text-[11px] md:text-xs font-black uppercase tracking-widest">
                Nossas viagens e guias
              </span>
              <Link href="/categoria/roteiros" className="text-[11px] md:text-xs font-bold text-[#B5B5B0] hover:text-[#9FD131] uppercase tracking-wider">
                Ver todos os roteiros →
              </Link>
            </div>
            <div className="ead-road relative overflow-hidden border-y border-dashed border-[#3a3a38] py-4">
              <div className="ead-road-track flex w-max gap-3.5">
                {roadLoop.map((item, i) => (
                  <Link
                    key={`${item.slug}-${i}`}
                    href={`/blog/${item.slug}`}
                    aria-hidden={i >= road.length}
                    tabIndex={i >= road.length ? -1 : 0}
                    className="group w-[280px] shrink-0 flex items-center gap-3 bg-[#262626] p-2.5 rounded-xl border border-white/10 hover:border-[#9FD131] transition-colors"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 relative bg-black/40">
                      <SmartImage src={item.image} alt="" sizes="64px" className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black text-[#9FD131] uppercase tracking-wider block">{item.label}</span>
                      <span className="text-white text-[13px] font-bold leading-snug line-clamp-2 group-hover:text-[#9FD131] transition-colors">
                        {item.title}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
