import { NavLink } from "react-router-dom";

const menuItems = [
  {
    section: "Général",
    items: [{ label: "Dashboard", icon: "📊", path: "/admin" }],
  },
  {
    section: "Référentiel",
    items: [
      { label: "Certifications", icon: "🎓", path: "/admin/certifications" },
      { label: "Établissements", icon: "🏫", path: "/admin/etablissements" },
      { label: "Organismes", icon: "🏢", path: "/admin/organismes" },
      { label: "Métiers", icon: "💼", path: "/admin/metiers" },
      { label: "Compétences", icon: "🧠", path: "/admin/competences" },
      { label: "Domaines", icon: "📚", path: "/admin/domaines" },
      { label: "Niveaux & Types", icon: "🏷️", path: "/admin/referentiels" },
      { label: "Régions & Villes", icon: "🗺️", path: "/admin/regions" },
    ],
  },
  {
    section: "Gestion",
    items: [
      { label: "Demandes", icon: "📥", path: "/admin/demandes" },
      { label: "Documents & Sources", icon: "📄", path: "/admin/documents" },
      { label: "Import massif", icon: "📤", path: "/admin/import" },
      { label: "Alertes & échéances", icon: "⏰", path: "/admin/alertes" },
    ],
  },
  {
    section: "Qualité & Audit",
    items: [
      { label: "Vérification", icon: "✅", path: "/admin/verification" },
      { label: "Historique / Audit", icon: "🕘", path: "/admin/historique" },
    ],
  },
  {
    section: "Administration",
    items: [
      { label: "Utilisateurs & rôles", icon: "👥", path: "/admin/utilisateurs" },
      { label: "Paramètres", icon: "⚙️", path: "/admin/parametres" },
    ],
  },
];

function AdminSidebar() {
  return (
    <aside className="fixed top-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">

      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-200 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-lg font-bold text-white">
          A
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">ANCPS</h2>
          <span className="text-xs text-gray-500">Back-office</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {menuItems.map((section) => (
          <div className="mb-6" key={section.section}>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {section.section}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin"}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? "bg-teal-50 font-semibold text-teal-700"
                        : "text-gray-600 hover:bg-teal-50 hover:text-teal-700"
                    }`
                  }
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Utilisateur */}
      <div className="flex shrink-0 items-center gap-3 border-t border-gray-200 px-4 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-700">
          A
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-800">Administrateur</p>
          <p className="truncate text-xs text-gray-500">Back-office ANCPS</p>
        </div>
      </div>

    </aside>
  );
}

export default AdminSidebar;