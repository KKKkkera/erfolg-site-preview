"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { ChevronRight, Loader2, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

type SearchSuggestion = {
  id: string;
  slug: string;
  name: string;
  model: string | null;
  brand: string | null;
  category: string;
  imageUrl: string | null;
  imageAlt: string | null;
};

type SearchStatus = "idle" | "loading" | "ready" | "error";

export function CatalogSearch({
  placeholder,
  mobile = false,
  autoFocus = false,
}: {
  placeholder: string;
  mobile?: boolean;
  /** Поле раскрыли по кнопке — курсор сразу в нём. */
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  /* На самой странице каталога поле работает как живой фильтр: правим ?q=
     в адресе, список перерисовывается сервером. Выпадающие подсказки там
     не нужны — результат и так виден под шапкой. */
  const liveFilter = pathname === "/catalog";
  /* Ниже xl телефон в шапке сворачивается в иконку, а поле поиска ужимается —
     длинная подсказка «Поиск среди N товаров» там всё равно обрезается,
     поэтому оставляем короткое слово. */
  const [compact, setCompact] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isNavigating, startTransition] = useTransition();
  const normalizedQuery = query.trim();

  useEffect(() => {
    if (mobile) return;
    const media = window.matchMedia("(max-width: 1279.98px)");
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [mobile]);

  /* Пришли на каталог по ссылке с ?q= — показываем запрос в поле, иначе
     поиск живёт своей жизнью: в адресе фильтр есть, а поле пустое. */
  useEffect(() => {
    if (!liveFilter) return;
    const fromUrl = new URLSearchParams(window.location.search).get("q") ?? "";
    setQuery((prev) => (prev.trim() ? prev : fromUrl));
  }, [liveFilter]);

  /* Живой поиск по каталогу: через паузу после ввода переписываем ?q=
     через replace — история не забивается по букве на запись. Прочие
     фильтры сохраняем, страницу сбрасываем на первую. */
  useEffect(() => {
    if (!liveFilter) return;
    const value = query.trim();
    const next = value.length >= 2 ? value : "";
    const params = new URLSearchParams(window.location.search);
    if (next === (params.get("q") ?? "")) return;

    const timer = setTimeout(() => {
      if (next) params.set("q", next);
      else params.delete("q");
      params.delete("page");
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `/catalog?${qs}` : "/catalog", { scroll: false });
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [liveFilter, query, router]);

  useEffect(() => {
    const requestQuery = query.trim();
    if (liveFilter || requestQuery.length < 2) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/catalog/search?q=${encodeURIComponent(requestQuery)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`Search failed: ${response.status}`);

        const payload = (await response.json()) as {
          items?: SearchSuggestion[];
        };
        if (controller.signal.aborted) return;

        setSuggestions(Array.isArray(payload.items) ? payload.items : []);
        setStatus("ready");
        setActiveIndex(-1);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("catalog suggestions request error", error);
        setSuggestions([]);
        setStatus("error");
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [liveFilter, query]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setQuery(value);
    setSuggestions([]);
    setActiveIndex(-1);

    if (!liveFilter && value.trim().length >= 2) {
      setStatus("loading");
      setOpen(true);
    } else {
      setStatus("idle");
      setOpen(false);
    }
  }

  function handleBlur(event: FocusEvent<HTMLFormElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setOpen(false);
    }
  }

  function goToProduct(product: SearchSuggestion) {
    setOpen(false);
    startTransition(() => router.push(`/catalog/${product.slug}`));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (event.key === "Escape") setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1,
      );
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      goToProduct(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (normalizedQuery.length < 2) return;

    setOpen(false);

    // На каталоге Enter не ждёт паузу ввода — применяем запрос сразу,
    // сохранив выбранные фильтры.
    if (liveFilter) {
      const params = new URLSearchParams(window.location.search);
      params.set("q", normalizedQuery);
      params.delete("page");
      startTransition(() => {
        router.replace(`/catalog?${params.toString()}`, { scroll: false });
      });
      return;
    }

    startTransition(() => {
      router.push(`/catalog?q=${encodeURIComponent(normalizedQuery)}`);
    });
  }

  function clearSearch() {
    setQuery("");
    setSuggestions([]);
    setStatus("idle");
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  const showPanel = !liveFilter && open && normalizedQuery.length >= 2;
  const busy = status === "loading" || isNavigating;

  return (
    <form
      action="/catalog"
      method="get"
      role="search"
      noValidate
      onSubmit={handleSubmit}
      onBlur={handleBlur}
      className={cn(
        "relative",
        mobile ? "w-full" : "hidden min-w-40 flex-1 lg:block xl:min-w-52",
      )}
    >
      <label htmlFor={`${listboxId}-input`} className="sr-only">
        Поиск по каталогу
      </label>
      <input
        ref={inputRef}
        id={`${listboxId}-input`}
        name="q"
        autoFocus={autoFocus}
        type="search"
        value={query}
        minLength={2}
        required
        autoComplete="off"
        placeholder={compact ? "Поиск" : placeholder}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showPanel}
        aria-controls={showPanel ? listboxId : undefined}
        aria-activedescendant={
          activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
        }
        onChange={handleChange}
        onFocus={() => {
          if (!liveFilter && normalizedQuery.length >= 2) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          "h-10 rounded-md border border-input bg-background pl-3 pr-16 text-base text-foreground sm:text-sm outline-none transition-colors placeholder:text-muted-foreground/45 focus:border-primary focus:ring-2 focus:ring-ring/20 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
          mobile ? "h-11 w-full" : "w-full",
        )}
      />

      {query ? (
        <button
          type="button"
          onClick={clearSearch}
          aria-label="Очистить поиск"
          className="absolute right-9 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
      <button
        type="submit"
        aria-label="Выполнить поиск"
        className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Search className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      {showPanel ? (
        <div
          id={listboxId}
          aria-busy={busy}
          className={cn(
            "absolute top-full z-[70] mt-2 overflow-hidden rounded-md border border-border bg-white shadow-xl",
            mobile
              ? "left-0 right-0"
              : "right-0 w-[min(34rem,calc(100vw-2rem))]",
          )}
        >
          {busy ? (
            <div
              role="status"
              aria-live="polite"
              className="flex min-h-16 items-center gap-3 px-4 py-4 text-sm text-muted-foreground"
            >
              <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
              Идёт поиск…
            </div>
          ) : status === "error" ? (
            <p className="px-4 py-5 text-sm text-muted-foreground">
              Не удалось загрузить подсказки. Нажмите Enter для поиска в каталоге.
            </p>
          ) : suggestions.length > 0 ? (
            <>
              <div
                role="listbox"
                aria-label="Подсказки поиска"
                className="max-h-[min(30rem,65vh)] divide-y divide-border overflow-y-auto"
              >
                {suggestions.map((product, index) => {
                  const image = product.imageUrl || "/placeholder-product.svg";
                  const meta = [product.brand, product.model || product.category]
                    .filter(Boolean)
                    .join(" · ");

                  return (
                    <Link
                      key={product.id}
                      id={`${listboxId}-option-${index}`}
                      role="option"
                      aria-selected={activeIndex === index}
                      href={`/catalog/${product.slug}`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onFocus={() => setActiveIndex(index)}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-surface focus:bg-surface focus:outline-none",
                        activeIndex === index && "bg-surface",
                      )}
                    >
                      <span className="relative block h-12 w-12 overflow-hidden rounded-sm border border-border bg-white">
                        <Image
                          src={image}
                          alt={product.imageAlt || product.name}
                          fill
                          sizes="48px"
                          className="object-contain p-1.5"
                          unoptimized={image.endsWith(".svg")}
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-primary">
                          {product.name}
                        </span>
                        <span className="mt-1 block truncate text-xs text-muted-foreground">
                          {meta}
                        </span>
                      </span>
                      <ChevronRight
                        className="h-4 w-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </Link>
                  );
                })}
              </div>
              <Link
                href={`/catalog?q=${encodeURIComponent(normalizedQuery)}`}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-4 border-t border-border px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-surface"
              >
                <span className="truncate">
                  Все результаты по запросу «{normalizedQuery}»
                </span>
                <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Link>
            </>
          ) : (
            <div
              role="status"
              className="px-4 py-5 text-sm text-muted-foreground"
            >
              По запросу ничего не найдено
            </div>
          )}
        </div>
      ) : null}
    </form>
  );
}
