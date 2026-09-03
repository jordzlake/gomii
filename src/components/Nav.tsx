"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { iconSrc, IconName } from "@/data/sprites";

const ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/today", label: "Today", icon: "calendar" },
  { href: "/quests", label: "Quests", icon: "checklist" },
  { href: "/create", label: "Create", icon: "pencil" },
  { href: "/goals", label: "Goals", icon: "target" },
  { href: "/character", label: "You", icon: "brain" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="nav">
      <div className="nav-inner">
        {ITEMS.map((i) => (
          <Link key={i.href} href={i.href} className="nav-item" data-active={path === i.href}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={iconSrc(i.icon)} alt="" width={26} height={26} />
            {i.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
