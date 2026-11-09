function StatCard({ title, value, icon, description }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      
      {/* Partie supérieure */}
      <div className="flex items-center justify-between">
        
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {value}
          </p>
        </div>

        {/* Icône */}
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-2xl">
          {icon}
        </div>

      </div>

      {/* Description */}
      <p className="mt-4 text-xs text-gray-500">
        {description}
      </p>

    </div>
  );
}

export default StatCard;