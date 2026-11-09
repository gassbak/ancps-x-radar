
export default function Select({ label, options = [], ...props }) {
  return (
    <label className="block text-sm">
      {label && <span className="mb-1.5 block font-semibold text-gray-700">{label}</span>}
      <select
        {...props}
        className={`w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${props.className || ""}`}
      >
        {options.map((option) =>
          typeof option === "string" ? (
            <option key={option} value={option}>
              {option}
            </option>
          ) : (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          )
        )}
      </select>
    </label>
  );
}
