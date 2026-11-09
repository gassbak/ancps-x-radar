import { Search } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder = "Rechercher..." }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-3 text-gray-400" size={18} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      />
    </div>
  );
}
