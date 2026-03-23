import { Archive, BarChart3, Bell, Brain, Building2, Calendar, CalendarCheck, CalendarClock, ClipboardList, FolderCog, Home, Package, Settings, Wrench } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/app/actions";
import { GlobalSearch } from "@/components/global-search";
import { MobileMenu } from "@/components/mobile-menu";
import { NavLink } from "@/components/nav-link";
import { QrScanner } from "@/components/qr-scanner";
import { roleLabels } from "@/lib/labels";

type AppShellProps = {
  user: {
    firstName: string;
    lastName: string;
    role: "USER" | "TECHNICIAN" | "MANAGER" | "ADMIN" | "SUPER_ADMIN";
    service: string | null;
  };
  unreadNotifications: number;
  children: React.ReactNode;
};

export function AppShell({ user, unreadNotifications, children }: AppShellProps) {
  const initials = `${user.firstName[0]}${user.lastName[0]}`;
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isManager = user.role === "ADMIN" || user.role === "MANAGER";
  const isTech = isManager || user.role === "TECHNICIAN";

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <div className="flex min-h-screen">
        {/* ===== SIDEBAR (desktop) ===== */}
        <aside className="hidden lg:flex w-[260px] flex-col bg-gradient-to-b from-indigo-950 via-indigo-950 to-slate-900 text-white fixed inset-y-0 left-0 z-30">
          <div className="px-6 pt-6 pb-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight">GMAO</h1>
                <p className="text-[11px] text-indigo-300">Maintenance</p>
              </div>
            </Link>
          </div>

          <div className="px-4 pb-3">
            <QrScanner />
          </div>

          <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
            {!isSuperAdmin ? (
              <>
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-indigo-400">General</p>
                {user.role !== "USER" ? (
                  <NavLink href="/" icon={<Home className="h-4 w-4" />} label="Tableau de bord" />
                ) : null}
                <NavLink href="/equipements" icon={<Package className="h-4 w-4" />} label="Equipements" />
                <NavLink href="/demandes" icon={<ClipboardList className="h-4 w-4" />} label="Demandes" />
                <NavLink href="/notifications" icon={<Bell className="h-4 w-4" />} label="Notifications" badge={unreadNotifications > 0 ? unreadNotifications : undefined} />
              </>
            ) : null}

            {isTech ? (
              <>
                <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-indigo-400">Technique</p>
                <NavLink href="/planning/today" icon={<CalendarCheck className="h-4 w-4" />} label="Mon planning" />
                <NavLink href="/demandes/kanban" icon={<ClipboardList className="h-4 w-4" />} label="Vue Kanban" />
                <NavLink href="/statistiques" icon={<BarChart3 className="h-4 w-4" />} label="Statistiques" />
                {(user.role === "ADMIN" || user.role === "MANAGER") ? (
                  <NavLink href="/statistiques/analytics" icon={<Brain className="h-4 w-4" />} label="Analytics" />
                ) : null}
              </>
            ) : null}

            {isManager ? (
              <>
                <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-indigo-400">Gestion</p>
                <NavLink href="/planning" icon={<CalendarCheck className="h-4 w-4" />} label="Planning" />
                <NavLink href="/maintenance" icon={<CalendarClock className="h-4 w-4" />} label="Maint. preventive" />
                <NavLink href="/maintenance/planning" icon={<Calendar className="h-4 w-4" />} label="Planning annuel" />
                <NavLink href="/demandes/archives" icon={<Archive className="h-4 w-4" />} label="Archives" />
              </>
            ) : null}

            {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") ? (
              <>
                <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-indigo-400">Administration</p>
                {user.role === "SUPER_ADMIN" ? (
                  <NavLink href="/admin/etablissements" icon={<Building2 className="h-4 w-4" />} label="Etablissements" />
                ) : null}
                <NavLink href="/admin/categories" icon={<FolderCog className="h-4 w-4" />} label="Categories" />
                <NavLink href="/admin/utilisateurs" icon={<Settings className="h-4 w-4" />} label="Utilisateurs" />
              </>
            ) : null}
          </nav>

          <div className="px-4 pb-5">
            <div className="rounded-xl bg-white/8 border border-white/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-indigo-300 truncate">{roleLabels[user.role]}</p>
                </div>
              </div>
              <form action={logoutAction} className="mt-3">
                <button className="w-full rounded-lg bg-red-500/90 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600">
                  Se deconnecter
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <div className="flex-1 lg:ml-[260px] flex flex-col">
          {/* Mobile top bar */}
          <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between bg-white/90 backdrop-blur border-b border-gray-200 px-4 py-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Wrench className="h-4 w-4" />
              </div>
              <h1 className="text-base font-bold text-gray-900">GMAO</h1>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/notifications" className="relative rounded-lg p-2 hover:bg-gray-100 transition">
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadNotifications > 0 ? (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                ) : null}
              </Link>
              <MobileMenu user={user} />
            </div>
          </header>

          {/* Desktop search bar */}
          <div className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-gray-200/60 bg-white/60 backdrop-blur">
            <GlobalSearch />
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{user.firstName} {user.lastName}</span>
              <span className="text-gray-300">|</span>
              <span className="text-indigo-600 font-medium">{roleLabels[user.role]}</span>
            </div>
          </div>

          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-6">
            <div className="mx-auto max-w-[1200px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
