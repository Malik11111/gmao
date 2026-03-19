"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

type NavLinkProps = {
  href: string;
  label: string;
  icon?: ReactNode;
  badge?: number;
};

export function NavLink({ href, label, icon, badge }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
        isActive
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
          : "text-indigo-200 hover:bg-white/8 hover:text-white"
      }`}
    >
      {icon ? <span className={isActive ? "text-white" : "text-indigo-400"}>{icon}</span> : null}
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 ? (
        <span
          className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
            isActive ? "bg-white/20 text-white" : "bg-red-500 text-white"
          }`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}
