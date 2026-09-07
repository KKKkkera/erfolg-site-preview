"use client"

import dynamic from "next/dynamic"
import { useTheme } from "next-themes"
import type { Toaster as Sonner } from "sonner"

/* Тосты показываются только после отправки формы, но <Toaster /> стоит в
   layout — то есть sonner попадал в первую загрузку каждой страницы.
   Отдельный чанк грузится вместе с формой, а не перед ней. ssr: false:
   контейнер тостов пуст до первого вызова toast(), в HTML ему нечего дать. */
const SonnerToaster = dynamic(
  () => import("sonner").then((m) => m.Toaster),
  { ssr: false },
)

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <SonnerToaster
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
