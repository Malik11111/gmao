"use client";

import { Archive, BarChart3, Bell, Brain, Building2, Calendar, CalendarCheck, CalendarClock, ClipboardList, FolderCog, Home, Menu, Package, Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";
import { logoutAction } from "@/app/actions";
import { QrScanner } from "@/components/qr-scanner";
import { roleLabels } from "@/lib/labels";

type MobileMenuProps = {
  user: {
    firstName: string;
    lastName: string;
    role: "USER" | "TECHNICIAN" | "MANAGER" | "ADMIN" | "SUPER_ADMIN";
    service: string | null;
  };
};

type NavLink = { href: string; label: string; icon: React.ElementType };

const baseLinks: NavLink[] = [
  { href: "/", label: "Tableau de bord", icon: Home },
  { href: "/equipements", label: "Equipements", icon: Package },
  { href: "/demandes", label: "Demandes", icon: ClipboardList },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

const personnelLinks: NavLink[] = [
  { href: "/equipements", label: "Equipements", icon: Package },
  { href: "/demandes", label: "Demandes", icon: ClipboardList },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

const techLinks: NavLink[] = [
  { href: "/planning/today", label: "Mon planning", icon: CalendarCheck },
  { href: "/demandes/kanban", label: "Vue Kanban", icon: ClipboardList },
  { href: "/statistiques", label: "Statistiques", icon: BarChart3 },
];

const managerLinks: NavLink[] = [
  { href: "/planning", label: "Planning", icon: CalendarCheck },
  { href: "/statistiques/analytics", label: "Analytics", icon: Brain },
  { href: "/maintenance", label: "Maint. preventive", icon: CalendarClock },
  { href: "/maintenance/planning", label: "Planning annuel", icon: Calendar },
  { href: "/demandes/archives", label: "Archives", icon: Archive },
];

const adminLinks: NavLink[] = [
  { href: "/admin/categories", label: "Categories", icon: FolderCog },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Settings },
];

const superAdminLinks: NavLink[] = [
  { href: "/admin/etablissements", label: "Etablissements", icon: Building2 },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Settings },
];

export function MobileMenu({ user }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const initials = `${user.firstName[0]}${user.lastName[0]}`;

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isManager = user.role === "ADMIN" || user.role === "MANAGER";
  const isTech = isManager || user.role === "TECHNICIAN";

  const superAdminAllLinks: NavLink[] = [
    ...superAdminLinks,
  ];

  const allLinks: NavLink[] = isSuperAdmin
    ? superAdminAllLinks
    : [
        ...(user.role === "USER" ? personnelLinks : baseLinks),
        ...(isTech ? techLinks : []),
        ...(isManager ? managerLinks : []),
        ...(user.role === "ADMIN" ? adminLinks : []),
      ];

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-gray-100 transition">
        <Menu className="h-5 w-5 text-gray-700" />
      </button>

      {open ? createPortal(
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <nav
            className="absolute right-0 top-0 h-full w-72 bg-gradient-to-b from-indigo-950 via-indigo-950 to-slate-900 text-white p-5 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold">Menu</p>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-white/10 transition">
                <X className="h-5 w-5 text-indigo-200" />
              </button>
            </div>

            {!isSuperAdmin ? (
              <div className="px-1 mb-3">
                <QrScanner />
              </div>
            ) : null}

            <div className="space-y-1 flex-1 overflow-y-auto">
              {allLinks.map((link) => {
                const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive ? "bg-indigo-600 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="rounded-xl bg-white/8 border border-white/10 p-4 mt-4">
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
                <button className="w-full rounded-lg bg-red-500/90 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600">
                  Se deconnecter
                </button>
              </form>
            </div>
          </nav>
        </div>,
        document.body
      ) : null}
    </>
  );
}
