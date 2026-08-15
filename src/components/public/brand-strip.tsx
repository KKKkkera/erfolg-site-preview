"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type Manufacturer = {
  name: string;
  logo: {
    src: string;
    width: number;
    height: number;
    className?: string;
  };
};

const MANUFACTURERS: Manufacturer[] = [
  {
    name: "Севкаврентген-Д",
    logo: {
      src: "/images/brands/sevkavrentgen-d.svg",
      width: 331,
      height: 48,
      className: "max-w-[184px]",
    },
  },
  {
    name: "Mindray",
    logo: {
      src: "/images/brands/mindray.png",
      width: 300,
      height: 102,
    },
  },
  {
    name: "GE HealthCare",
    logo: {
      src: "/images/brands/ge-healthcare.svg",
      width: 144,
      height: 32,
    },
  },
  {
    name: "OLYMPUS",
    logo: {
      src: "/images/brands/olympus.svg",
      width: 850,
      height: 159,
    },
  },
  {
    name: "KARL STORZ",
    logo: {
      src: "/images/brands/karl-storz.webp",
      width: 1920,
      height: 679,
    },
  },
  {
    name: "Dräger",
    logo: {
      src: "/images/brands/draeger.webp",
      width: 1920,
      height: 800,
    },
  },
  {
    name: "HAMILTON MEDICAL",
    logo: {
      src: "/images/brands/hamilton-medical.svg",
      width: 1800,
      height: 345,
    },
  },
];

function ManufacturerList({
  listRef,
  hidden = false,
}: {
  listRef?: React.RefObject<HTMLUListElement | null>;
  hidden?: boolean;
}) {
  return (
    <ul
      ref={listRef}
      className="flex shrink-0 items-stretch"
      aria-hidden={hidden ? "true" : undefined}
    >
      {MANUFACTURERS.map((manufacturer) => (
        <li
          key={`${hidden ? "clone-" : ""}${manufacturer.name}`}
          className="group flex h-32 w-[224px] shrink-0 items-center justify-center border-r guide-border px-7 text-foreground/75 transition-colors duration-300 hover:text-foreground md:h-36 md:w-[248px]"
          title={manufacturer.name}
        >
          <Image
            src={manufacturer.logo.src}
            alt={manufacturer.name}
            width={manufacturer.logo.width}
            height={manufacturer.logo.height}
            className={cn(
              "max-h-11 w-auto max-w-[170px] object-contain opacity-65 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0",
              manufacturer.logo.className,
            )}
            unoptimized={manufacturer.logo.src.endsWith(".svg")}
          />
        </li>
      ))}
    </ul>
  );
}

export function BrandStrip() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const firstListRef = useRef<HTMLUListElement>(null);
  const targetSpeedRef = useRef(42);
  const ignoreHoverRef = useRef(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const firstList = firstListRef.current;
    if (!viewport || !track || !firstList) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    let frameId: number | null = null;
    let offset = 0;
    let velocity = targetSpeedRef.current;
    let listWidth = firstList.getBoundingClientRect().width;
    let previousTime = performance.now();

    const measure = () => {
      listWidth = firstList.getBoundingClientRect().width;
    };
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(firstList);

    const animate = (time: number) => {
      const delta = Math.min((time - previousTime) / 1000, 0.064);
      previousTime = time;

      const target = targetSpeedRef.current;
      const easing = target === 0 ? 5.2 : 2.8;
      velocity += (target - velocity) * (1 - Math.exp(-easing * delta));
      if (target === 0 && velocity < 0.08) velocity = 0;

      offset -= velocity * delta;
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
      targetSpeedRef.current = 42;
      ignoreHoverRef.current = true;
      if (frameId === null) frameId = requestAnimationFrame(animate);
    };
    const handleVisibilityChange = () => {
      if (document.hidden) suspendAnimation();
      else resumeAnimation();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", suspendAnimation);
    window.addEventListener("focus", resumeAnimation);
    window.addEventListener("pagehide", suspendAnimation);
    window.addEventListener("pageshow", resumeAnimation);

    return () => {
      suspendAnimation();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", suspendAnimation);
      window.removeEventListener("focus", resumeAnimation);
      window.removeEventListener("pagehide", suspendAnimation);
      window.removeEventListener("pageshow", resumeAnimation);
    };
  }, []);

  const slowToStop = () => {
    if (ignoreHoverRef.current) return;
    targetSpeedRef.current = 0;
  };
  const accelerate = () => {
    ignoreHoverRef.current = false;
    targetSpeedRef.current = 42;
  };
  const restoreHover = () => {
    if (!ignoreHoverRef.current) return;
    ignoreHoverRef.current = false;
    targetSpeedRef.current = 0;
  };

  return (
    <section className="brand-strip rails border-b guide-border bg-white">
      <div className="brand-strip-layout relative flex min-h-32 md:min-h-36">
        <span className="brand-strip-mark brand-strip-mark-tl" aria-hidden="true" />
        <span className="brand-strip-mark brand-strip-mark-bl" aria-hidden="true" />
        <span className="brand-strip-mark brand-strip-mark-br" aria-hidden="true" />

        <div className="relative z-10 hidden w-[250px] shrink-0 items-center border-r guide-border bg-white px-7 lg:flex xl:w-[280px] xl:px-8">
          <p className="font-mono text-[15px] font-medium uppercase leading-[1.55] tracking-[0.055em] text-foreground">
            Оборудование только
            <br />
            от проверенных
            <br />
            производителей
          </p>
        </div>

        <div
          ref={viewportRef}
          className="manufacturer-marquee relative min-w-0 flex-1 overflow-hidden"
          role="region"
          aria-label="Производители медицинского оборудования"
          tabIndex={0}
          onMouseEnter={slowToStop}
          onMouseLeave={accelerate}
          onMouseMove={restoreHover}
          onFocus={slowToStop}
          onBlur={accelerate}
        >
          <div ref={trackRef} className="flex h-full w-max will-change-transform">
            <ManufacturerList listRef={firstListRef} />
            <ManufacturerList hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
