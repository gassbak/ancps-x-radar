const verificationItems = [
  {
    id: 1,
    name: "Développement Web",
    type: "Certification",
    organization: "Bakeli School",
    date: "14 septembre 2026",
    status: "À vérifier",
  },
  {
    id: 2,
    name: "Licence Géographie",
    type: "Certification",
    organization: "UCAD",
    date: "13 septembre 2026",
    status: "À vérifier",
  },
  {
    id: 3,
    name: "Établissement de formation professionnelle",
    type: "Établissement",
    organization: "Institut X",
    date: "12 septembre 2026",
    status: "À vérifier",
  },
];

function VerificationList() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

      {/* En-tête */}
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

        <div>
          <h2 className="text-base font-semibold text-gray-900">
            À vérifier
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Éléments nécessitant une vérification
          </p>
        </div>

        <button
          type="button"
          className="text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          Voir tout
        </button>

      </div>

      {/* Liste */}
      <div className="divide-y divide-gray-100">

        {verificationItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between px-5 py-4 hover:bg-gray-50"
          >

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                {item.name}
              </p>

              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                <span>{item.type}</span>
                <span>•</span>
                <span>{item.organization}</span>
              </div>
            </div>

            <div className="ml-4 shrink-0 text-right">
              <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                {item.status}
              </span>

              <p className="mt-1 text-xs text-gray-400">
                {item.date}
              </p>
            </div>

          </div>
        ))}

      </div>

    </div>
  );
}

export default VerificationList;