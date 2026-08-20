import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      /* Поле контейнера = внешний отступ до вертикали разметки (--page-gutter)
         + отступ от вертикали до текста (--page-pad). Обе переменные объявлены
         в globals.css и там же растут по брейкпоинтам; от --page-gutter
         считаются .rails и .marks. Числом здесь задавать нельзя — разъедется. */
      padding: "calc(var(--page-gutter) + var(--page-pad))",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          dark: "hsl(var(--primary-dark))",
        },
        /* Фирменный голубой логотипа — крупный декор, линии, графика.
           Для мелкого текста НЕ использовать: на белом всего ~2.6:1. */
        brand: "hsl(var(--brand))",
        /* Фирменный оранжевый: DEFAULT — декор/крупное/на тёмном (4.6:1 на ink),
           ink — затемнённый для мелкого текста на светлом (5.1:1 на белом). */
        flame: {
          DEFAULT: "hsl(var(--accent-brand))",
          ink: "hsl(var(--accent-ink))",
          cta: "var(--accent-cta)",
          "cta-hover": "var(--accent-cta-hover)",
        },
        /* Тёмные «чернильные» секции: футер, CTA-баннеры */
        ink: {
          DEFAULT: "hsl(var(--ink))",
          foreground: "hsl(var(--ink-foreground))",
          muted: "hsl(var(--ink-muted))",
          border: "hsl(var(--ink-border))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        /* Прямые углы по всей системе: кнопки, карточки, поля, панели.
           full оставлен — им пользуются круглые элементы админки. */
        none: "0",
        sm: "0",
        DEFAULT: "0",
        md: "0",
        lg: "0",
        xl: "0",
        "2xl": "0",
        "3xl": "0",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "Consolas", "monospace"],
      },
      boxShadow: {
        /* Плоская система: тень почти не участвует, объём дают hairline-рамки.
           Токены сохранены — их используют существующие admin-компоненты. */
        card: "0 1px 2px 0 rgb(9 28 41 / 0.04)",
        "card-hover": "0 10px 30px -18px rgb(9 28 41 / 0.28)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        marquee: "marquee 40s linear infinite",
      },
    },
  },
  // typography обязателен: класс `prose` стоит на всех CMS-страницах
  // (политика ПДн, согласие, cookie, лицензии, «О компании»), в статьях блога
  // и в описании товара. Без плагина эти классы не значат ничего — заголовки
  // не отличались от текста, у списков не было маркеров, ссылки не выделялись.
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;
