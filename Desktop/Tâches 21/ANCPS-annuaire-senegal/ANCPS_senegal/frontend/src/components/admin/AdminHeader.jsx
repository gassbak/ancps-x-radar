function AdminHeader() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      
      {/* Partie gauche */}
      <div>
        <p className="text-sm text-gray-500">
          ANCPS / Back-office
        </p>
      </div>

      {/* Partie droite */}
      <div className="flex items-center gap-4">

        {/* Notifications */}
        <button
          type="button"
          className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
        >
          <span className="text-xl">🔔</span>

          {/* Badge notification */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Séparateur */}
        <div className="h-8 w-px bg-gray-200"></div>

        {/* Utilisateur */}
        <div className="flex items-center gap-3">
          
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800">
              Administrateur
            </p>

            <p className="text-xs text-gray-500">
              Super administrateur
            </p>
          </div>

          <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold">
            A
          </div>

        </div>

      </div>
    </header>
  );
}

export default AdminHeader;