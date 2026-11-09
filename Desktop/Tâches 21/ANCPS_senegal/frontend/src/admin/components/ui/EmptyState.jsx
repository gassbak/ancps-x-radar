import { Search } from "lucide-react";

export default function EmptyState({
  title = "Aucun élément",
  text = "Aucune donnée ne correspond à votre recherche.",
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
      <div className="mx-auto mb-3 w-fit rounded-full bg-white p-3 shadow-sm">
        <Search className="text-gray-400" />
      </div>
      <h3 className="font-bold text-gray-800">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{text}</p>
    </div>
  );
}
