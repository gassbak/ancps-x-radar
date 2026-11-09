
import { useCallback, useEffect, useState } from "react";
import { Bell, Check, RefreshCw } from "lucide-react";

import {
  loadNotifications,
  markNotificationRead,
} from "../services/adminApi";

import { PageHeader, Button } from "../components/ui";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setError("");

      const data = await loadNotifications();

      setNotifications(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Erreur notifications :",
        error
      );

      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    // Actualisation automatique
    const interval = setInterval(() => {
      refresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [refresh]);

  const markAsRead = async (notification) => {
    try {
      await markNotificationRead(notification.id);

      setNotifications((list) =>
        list.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                read: true,
              }
            : item
        )
      );

      window.dispatchEvent(
        new Event("ancps-store-change")
      );
    } catch (error) {
      console.error(
        "Erreur lecture notification :",
        error
      );

      alert(error.message);
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Contributions, documents manquants et échéances."
        action={
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={refresh}
          >
            Actualiser
          </Button>
        }
      />

      {/* Résumé */}
      <div className="mb-6 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
            <Bell size={24} />
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Notifications
            </p>

            <p className="text-2xl font-bold text-gray-900">
              {notifications.length}
            </p>
          </div>

          <div className="ml-auto">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
              {unreadCount} non lue
              {unreadCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Chargement */}
      {loading && (
        <div className="rounded-2xl border bg-white p-8 text-center text-gray-500">
          Chargement des notifications...
        </div>
      )}

      {/* Erreur */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Impossible de charger les notifications.

          <div className="mt-3">
            <Button
              variant="secondary"
              onClick={refresh}
            >
              Réessayer
            </Button>
          </div>
        </div>
      )}

      {/* Aucune notification */}
      {!loading &&
        !error &&
        notifications.length === 0 && (
          <div className="rounded-2xl border bg-white p-10 text-center">
            <Bell
              size={40}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-4 font-bold text-gray-900">
              Aucune notification
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Vous n'avez aucune nouvelle notification.
            </p>
          </div>
        )}

      {/* Liste */}
      {!loading &&
        !error &&
        notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                  notification.read
                    ? "opacity-60"
                    : "border-emerald-200"
                }`}
              >
                <div className="flex gap-4">
                  <div className="h-fit rounded-xl bg-emerald-50 p-3 text-emerald-700">
                    <Bell />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col justify-between gap-4 md:flex-row">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {notification.title}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          {notification.text}
                        </p>
                      </div>

                      {!notification.read && (
                        <Button
                          variant="soft"
                          icon={Check}
                          onClick={() =>
                            markAsRead(notification)
                          }
                        >
                          Marquer lu
                        </Button>
                      )}
                    </div>

                    <p className="mt-3 text-xs text-gray-400">
                      {notification.date}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
