"use client";

import { Bell, ClipboardList, Home, Menu, Package, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/actions";
import { roleLabels } from "@/lib/labels";

type MobileMenuProps = {
  user: {
    firstName: string;
    lastName: string;
    role: "USER" | "TECHNICIAN" | "MANAGER" | "ADMIN";
    service: string | null;
  };
};

const links = [
  { href: "/", label: "Tableau de bord", icon: Home },
  { href: "/equipements", label: "Equipements", icon: Package },
  { href: "/demandes", label: "Demandes", icon: ClipboardList },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export function MobileMenu({ user }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const initials = `${user.firstName[0]}${user.lastName[0]}`;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-gray-100 transition">
        <Menu className="h-5 w-5 text-gray-700" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <nav
            className="absolute right-0 top-0 h-full w-72 bg-gradient-to-b from-indigo-950 via-indigo-950 to-slate-900 text-white p-5 space-y-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Menu</p>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-white/10 transition">
                <X className="h-5 w-5 text-indigo-200" />
              </button>
            </div>

            <div className="space-y-1">
              {links.map((link) => {
                const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive ? "bg-indigo-600 text-white" : "text-indigo-200 hover:bg-white/8"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="rounded-xl bg-white/8 border border-white/10 p-4 mt-auto">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-indigo-300">{roleLabels[user.role]}</p>
                </div>
              </div>
              <form action={logoutAction} className="mt-3">
                <button className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-indigo-200 transition hover:bg-white/10">
                  Se deconnecter
                </button>
              </form>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
