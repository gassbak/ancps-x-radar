const activities = [
  {
    id: 1,
    action: "Certification ajoutée",
    name: "Développement Web",
    user: "Administrateur",
    time: "Il y a 20 min",
  },
  {
    id: 2,
    action: "Établissement modifié",
    name: "Bakeli School",
    user: "Administrateur",
    time: "Il y a 1 h",
  },
  {
    id: 3,
    action: "Organisme publié",
    name: "Ministère de la Formation professionnelle",
    user: "Administrateur",
    time: "Il y a 3 h",
  },
  {
    id: 4,
    action: "Certification vérifiée",
    name: "Licence Géographie",
    user: "Vérificateur",
    time: "Il y a 5 h",
  },
];

function RecentActivity() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

      {/* En-tête */}
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-900">
          Activité récente
        </h2>

        <p className="mt-1 text-xs text-gray-500">
          Dernières actions effectuées dans le back-office
        </p>
      </div>

      {/* Activités */}
      <div className="divide-y divide-gray-100">

        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 px-5 py-4"
          >

            {/* Avatar */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700">
              A
            </div>

            <div className="min-w-0">
              <p className="text-sm text-gray-800">
                <span className="font-semibold">
                  {activity.action}
                </span>
              </p>

              <p className="mt-1 truncate text-xs text-gray-500">
                {activity.name}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                {activity.user} · {activity.time}
              </p>
            </div>

          </div>
        ))}

      </div>

    </div>
  );
}

export default RecentActivity;