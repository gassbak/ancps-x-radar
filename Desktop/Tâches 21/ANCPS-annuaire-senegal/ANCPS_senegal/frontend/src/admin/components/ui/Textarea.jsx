
export default function Textarea({ label, ...props }) {
  return (
    <label className="block text-sm">
      {label && <span className="mb-1.5 block font-semibold text-gray-700">{label}</span>}
      <textarea
        {...props}
        className={`w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${props.className || ""}`}
      />
    </label>
  );
}
