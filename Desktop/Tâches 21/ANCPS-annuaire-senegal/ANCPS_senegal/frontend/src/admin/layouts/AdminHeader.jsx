import { useNavigate } from "react-router-dom";
import { Menu, Bell, ShieldCheck } from "lucide-react";

import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function AdminHeader({ session, unreadCount, onOpenSidebar }) {
  const navigate = useNavigate();
  const role = session?.role;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 px-4 shadow-sm backdrop-blur sm:px-6">
      <Link
  to="/"
  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
>
  <ArrowLeft size={17} />
  <span className="hidden sm:inline">Retour au site</span>
  </Link>
      <button onClick={onOpenSidebar} className="rounded-lg p-2 hover:bg-gray-100 lg:hidden">
        <Menu />
      </button>

      <div className="hidden items-center gap-2 text-sm text-gray-500 sm:flex">
        <ShieldCheck size={17} className="text-emerald-700" />
        Gouvernance & qualité des données
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={() => navigate("/admin/notifications")}
          className="relative rounded-lg p-2 hover:bg-gray-100"
        >
          <Bell size={19} />
          {unreadCount > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />}
        </button>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-bold">{session?.name}</p>
          <p className="text-xs text-gray-500">{role}</p>
        </div>

        <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-800">
          {session?.name?.charAt(0)?.toUpperCase() || "A"}
        </div>
      </div>
    </header>
  );
}
