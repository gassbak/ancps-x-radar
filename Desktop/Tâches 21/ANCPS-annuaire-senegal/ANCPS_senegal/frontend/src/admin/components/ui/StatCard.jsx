
const TONE_STYLES = {
  emerald: "bg-emerald-50 text-emerald-700",
  blue: "bg-blue-50 text-blue-700",
  yellow: "bg-yellow-50 text-yellow-700",
  red: "bg-red-50 text-red-700",
};

export default function StatCard({ label, value, icon: Icon, tone = "emerald", detail }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-gray-900">{value}</p>
          {detail && <p className="mt-1 text-xs text-gray-500">{detail}</p>}
        </div>
        <div className={`rounded-xl p-3 ${TONE_STYLES[tone]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
