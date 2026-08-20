"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export type BrandStripItem = {
  slug: string;
  name: string;
  logo: string | null;
  /* Число опубликованных товаров бренда. Ноль → плитка не кликабельна:
     фильтр каталога по такому бренду открывает пустую выдачу, а лента
     из 35 логотипов дала бы 28 таких тупиков. */
  productCount: number;
};

const MARQUEE_SPEED = 63;
const MARQUEE_HOVER_SPEED = MARQUEE_SPEED / 2;
const SPEED_EASING = 8;

function BrandInner({
  manufacturer,
  hidden,
}: {
  manufacturer: BrandStripItem;
  hidden: boolean;
}) {
  if (manufacturer.logo) {
    return (
      <span className="block h-8 w-36">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={manufacturer.logo}
          alt={manufacturer.name}
          className="block h-full w-full object-contain opacity-100 grayscale-0 transition duration-300 md:opacity-65 md:grayscale md:group-hover:opacity-100 md:group-hover:grayscale-0"
          loading={hidden ? "lazy" : "eager"}
          decoding="async"
        />
      </span>
    );
  }

  return (
    <span className="max-w-[190px] text-center font-heading text-[15px] font-semibold leading-tight tracking-[-0.02em] text-foreground/70 transition-colors duration-300 group-hover:text-foreground md:text-base">
      {manufacturer.name}
    </span>
  );
}

function ManufacturerList({
  manufacturers,
  listRef,
  hidden = false,
}: {
  manufacturers: BrandStripItem[];
  listRef?: React.RefObject<HTMLUListElement | null>;
  hidden?: boolean;
}) {
  return (
    <ul
      ref={listRef}
      className="flex shrink-0 items-stretch"
      aria-hidden={hidden ? "true" : undefined}
    >
      {manufacturers.map((manufacturer) => {
        const clickable = manufacturer.productCount > 0;
        const cell =
          "flex h-full w-full items-center justify-center px-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";

        return (
          <li
            key={`${hidden ? "clone-" : ""}${manufacturer.slug}`}
            className="group flex h-20 w-[208px] shrink-0 items-stretch border-r guide-border md:h-24 md:w-[232px]"
            title={manufacturer.name}
          >
            {clickable ? (
              <Link
                href={`/catalog?brand=${manufacturer.slug}`}
                className={cell}
                aria-label={`Каталог: ${manufacturer.name}`}
                tabIndex={hidden ? -1 : undefined}
              >
                <BrandInner manufacturer={manufacturer} hidden={hidden} />
              </Link>
            ) : (
              <span className={cell}>
                <BrandInner manufacturer={manufacturer} hidden={hidden} />
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function BrandStrip({ brands }: { brands: BrandStripItem[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const firstListRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const firstList = firstListRef.current;
    if (!viewport || !track || !firstList) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    let frameId: number | null = null;
    let offset = 0;
    let listWidth = firstList.getBoundingClientRect().width;
    let previousTime = performance.now();
    let currentSpeed = MARQUEE_SPEED;
    let targetSpeed = MARQUEE_SPEED;

    const measure = () => {
      listWidth = firstList.getBoundingClientRect().width;
    };
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(firstList);

    const animate = (time: number) => {
      const delta = Math.min((time - previousTime) / 1000, 0.064);
      previousTime = time;

      const easing = 1 - Math.exp(-SPEED_EASING * delta);
      currentSpeed += (targetSpeed - currentSpeed) * easing;
      offset -= currentSpeed * delta;
      if (listWidth > 0 && offset <= -listWidth) offset += listWidth;
      track.style.transform = `translate3d(${offset}px, 0, 0)`;

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    const suspendAnimation = () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
    };
    const resumeAnimation = () => {
      previousTime = performance.now();
      if (frameId === null) frameId = requestAnimationFrame(animate);
    };
    const handleVisibilityChange = () => {
      if (document.hidden) suspendAnimation();
      else resumeAnimation();
    };
    const slowDown = () => {
      targetSpeed = MARQUEE_HOVER_SPEED;
    };
    const speedUp = () => {
      targetSpeed = MARQUEE_SPEED;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    viewport.addEventListener("mouseenter", slowDown);
    viewport.addEventListener("mouseleave", speedUp);
    window.addEventListener("blur", suspendAnimation);
    window.addEventListener("focus", resumeAnimation);
    window.addEventListener("pagehide", suspendAnimation);
    window.addEventListener("pageshow", resumeAnimation);

    return () => {
      suspendAnimation();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      viewport.removeEventListener("mouseenter", slowDown);
      viewport.removeEventListener("mouseleave", speedUp);
      window.removeEventListener("blur", suspendAnimation);
      window.removeEventListener("focus", resumeAnimation);
      window.removeEventListener("pagehide", suspendAnimation);
      window.removeEventListener("pageshow", resumeAnimation);
    };
  }, []);

  if (brands.length === 0) return null;

  return (
    <section className="brand-strip rails border-b guide-border bg-white">
      <div className="brand-strip-layout relative flex min-h-20 md:min-h-24">
        <span className="brand-strip-mark brand-strip-mark-tl" aria-hidden="true" />
        <span className="brand-strip-mark brand-strip-mark-bl" aria-hidden="true" />
        <span className="brand-strip-mark brand-strip-mark-br" aria-hidden="true" />

        <div className="relative z-10 hidden w-[250px] shrink-0 items-center border-r guide-border bg-white px-7 lg:flex xl:w-[280px] xl:px-8">
          <p className="font-mono text-[15px] font-medium leading-[1.55] text-foreground">
            Работаем с 2012 года
            <br />
            только с проверенным
            <br />
            оборудованием
          </p>
        </div>

        <div
          ref={viewportRef}
          className="manufacturer-marquee relative min-w-0 flex-1 overflow-hidden"
          role="region"
          aria-label="Производители медицинского оборудования"
        >
          <div ref={trackRef} className="flex h-full w-max will-change-transform">
            <ManufacturerList manufacturers={brands} listRef={firstListRef} />
            <ManufacturerList manufacturers={brands} hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
