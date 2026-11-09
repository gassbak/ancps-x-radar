
export default function Input({ label, ...props }) {
  return (
    <label className="block text-sm">
      {label && <span className="mb-1.5 block font-semibold text-gray-700">{label}</span>}
      <input
        {...props}
        className={`w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${props.className || ""}`}
      />
    </label>
  );
}
