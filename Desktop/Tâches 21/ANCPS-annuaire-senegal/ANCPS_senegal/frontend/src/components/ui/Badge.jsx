export default function Badge({
  children,
  variant = "blue",
}) {
  const variants = {
    blue: "bg-[#DBEAFE] text-[#1D4ED8]",
    green: "bg-[#D1FAE5] text-[#047857]",
    gray: "bg-[#E2E8F0] text-[#475569]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium leading-none ${variants[variant]}`}
    >
      {children}
    </span>
  );
}