
const VARIANT_STYLES = {
  primary: "bg-emerald-700 text-white hover:bg-emerald-800",
  secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
  warning: "bg-yellow-500 text-emerald-950 hover:bg-yellow-400",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-gray-600 hover:bg-gray-100",
  soft: "bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
};

export default function Button({
  children,
  variant = "primary",
  icon: Icon,
  className = "",
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${VARIANT_STYLES[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}
