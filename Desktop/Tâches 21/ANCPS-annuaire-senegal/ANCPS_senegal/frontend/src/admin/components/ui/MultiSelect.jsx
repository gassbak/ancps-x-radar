
export default function MultiSelect({ label, options = [], value = [], onChange }) {
  const toggle = (optionValue) => {
    const next = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];

    onChange(next);
  };

  return (
    <label className="block text-sm">
      {label && <span className="mb-1.5 block font-semibold text-gray-700">{label}</span>}
      <div className="max-h-40 space-y-0.5 overflow-auto rounded-lg border border-gray-300 p-2">
        {options.length === 0 && (
          <p className="px-1 text-xs text-gray-400">Aucune option — à ajouter dans le référentiel.</p>
        )}

        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 rounded px-1 py-1 hover:bg-gray-50">
            <input
              type="checkbox"
              checked={value.includes(option.value)}
              onChange={() => toggle(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </label>
  );
}
