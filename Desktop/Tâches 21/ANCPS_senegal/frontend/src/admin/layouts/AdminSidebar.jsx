import { NavLink } from "react-router-dom";
import { X, LogOut } from "lucide-react";
import { NAV_GROUPS } from "../config/navigation";
import { can } from "../services/adminStore";

export default function AdminSidebar({ session, unreadCount, open, onClose, onLogout }) {
  const role = session?.role;

  const visibleGroups = NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => can(role, item.permission)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col
        border-r border-emerald-950/20 bg-emerald-950 text-white
        transition-transform lg:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}`}
    >
      {/* En-tête de la sidebar */}
      <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/10 px-5">
        <div className="flex items-center gap-2 font-extrabold tracking-wide">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-yellow-500 text-emerald-950">A</div>
          ANCPS
          <span className="text-xs font-normal text-emerald-200">BACK-OFFICE</span>
        </div>

        <button className="lg:hidden" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      {/* Rôle courant */}
      <div className="flex-shrink-0 border-b border-white/10 px-4 py-3">
        <div className="rounded-xl bg-emerald-900/70 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Connecté en tant que</p>
          <p className="mt-1 text-sm font-bold text-white">{session?.name}</p>
          <p className="mt-0.5 text-xs text-emerald-200">{role}</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 pb-6">
        {visibleGroups.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              {group.title}
            </p>

            <nav className="space-y-1">
              {group.items.map(({ key, label, icon: Icon }) => (
                <NavLink
                  key={key}
                  to={`/admin/${key}`}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive ? "bg-white text-emerald-950 shadow" : "text-emerald-50 hover:bg-emerald-900"
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{label}</span>

                  {key === "notifications" && unreadCount > 0 && (
                    <span className="ml-auto rounded-full bg-yellow-500 px-2 py-0.5 text-[10px] font-bold text-emerald-950">
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Déconnexion */}
      <div className="flex-shrink-0 border-t border-white/10 p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-emerald-900"
        >
          <LogOut size={18} />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
