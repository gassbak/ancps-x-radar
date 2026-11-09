import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { loadNotifications } from "../services/adminApi";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

// Coquille commune à toutes les pages du back-office :
// sidebar + header + zone de contenu (Outlet des routes admin).
export default function AdminLayout({ session, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Compte les notifications non lues, et se met à jour quand une page le signale
  useEffect(() => {
    const refresh = () =>
      loadNotifications()
        .then((items) => setUnreadCount(items.filter((n) => !n.read).length))
        .catch(() => setUnreadCount(0));

    refresh();
    window.addEventListener("ancps-store-change", refresh);
    return () => window.removeEventListener("ancps-store-change", refresh);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <AdminSidebar
        session={session}
        unreadCount={unreadCount}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
      />

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="lg:pl-72">
        <AdminHeader session={session} unreadCount={unreadCount} onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
