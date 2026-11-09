export default function Button({
  children,
  type = "button",
  onClick,
  variant = "primary",
  className = "",
}) {
  const variants = {
    primary:
      "bg-emerald-700 text-white hover:bg-emerald-800",
    yellow:
      "bg-yellow-400 text-slate-900 hover:bg-yellow-500",
    secondary:
      "bg-slate-100 text-slate-800 hover:bg-slate-200",
    danger:
      "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-lg px-5 py-3 font-semibold transition ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}