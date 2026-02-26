"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/air-quality", label: "Air Quality" },
  { href: "/covid", label: "COVID-19" },
  { href: "/flu", label: "Flu/ILI" },
  { href: "/food-safety", label: "Food Safety" },
  { href: "/environment", label: "Environment" },
  { href: "/chronic-disease", label: "Chronic Disease" },
  { href: "/overdose", label: "Overdose & Lead" },
  { href: "/nutrition", label: "Nutrition" },
  { href: "/demographics", label: "Demographics" },
  { href: "/sources", label: "All Sources" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 mb-6 pb-2.5 border-b border-border">
      {navItems.map(({ href, label }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={[
              "text-[12px] font-semibold px-3.5 py-1.5 rounded-lg border transition-all duration-150",
              isActive
                ? "text-hp-green bg-hp-green/10 border-hp-green/20"
                : "text-dim border-transparent hover:text-text hover:bg-surface",
            ].join(" ")}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
