"use client";

import { useMemo } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useAppTheme, type ThemePreference } from "@/shared/theme/theme-provider";
import { en } from "@/shared/i18n";

const OPTIONS: Array<{
  id: ThemePreference;
  label: string;
  Icon: typeof Sun;
}> = [
  { id: "light", label: en.theme.light, Icon: Sun },
  { id: "system", label: en.theme.system, Icon: Monitor },
  { id: "dark", label: en.theme.dark, Icon: Moon },
];

export function ThemeToggle() {
  const { preference, setPreference } = useAppTheme();

  const activeIndex = useMemo(() => {
    const i = OPTIONS.findIndex((o) => o.id === preference);
    return i >= 0 ? i : 1;
  }, [preference]);

  return (
    <div
      role="group"
      aria-label={en.theme.appearanceGroup}
      className="theme-toggle-glass relative isolate flex h-11 items-center rounded-full p-[3px]"
    >
      {/* Liquid glass shell */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full border border-white/45 bg-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_8px_24px_rgba(15,23,42,0.08),0_1px_2px_rgba(15,23,42,0.06)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/12 dark:bg-white/[0.08] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_28px_rgba(0,0,0,0.35),0_1px_2px_rgba(0,0,0,0.25)]"
      />
      {/* Soft specular rim */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[1px] rounded-full bg-gradient-to-b from-white/50 via-transparent to-transparent opacity-80 dark:from-white/15"
      />

      {/* Sliding liquid thumb */}
      <span
        aria-hidden
        className="theme-toggle-thumb pointer-events-none absolute top-[3px] bottom-[3px] left-[3px] z-[1] w-[calc((100%-6px)/3)] rounded-full"
        style={{
          transform: `translate3d(${activeIndex * 100}%, 0, 0)`,
        }}
      />

      {OPTIONS.map(({ id, label, Icon }) => {
        const active = preference === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setPreference(id)}
            className={`relative z-[2] flex h-full w-11 shrink-0 items-center justify-center rounded-full transition-[color,transform,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.92] ${
              active
                ? "text-primary"
                : "text-fg-muted/80 hover:text-heading"
            }`}
            aria-pressed={active}
            aria-label={label}
            title={label}
          >
            <Icon
              className={`h-[17px] w-[17px] transition-transform duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)] ${
                active ? "scale-110" : "scale-100"
              }`}
              strokeWidth={active ? 2 : 1.6}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}
