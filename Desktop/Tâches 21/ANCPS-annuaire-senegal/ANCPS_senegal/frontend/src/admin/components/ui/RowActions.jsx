import { Eye, Edit3, Archive, Trash2 } from "lucide-react";

export default function RowActions({ onView, onEdit, onDelete, onArchive }) {
  return (
    <div className="flex items-center justify-end gap-1">
      {onView && (
        <button title="Voir" onClick={onView} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-emerald-700">
          <Eye size={17} />
        </button>
      )}
      {onEdit && (
        <button title="Modifier" onClick={onEdit} className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-700">
          <Edit3 size={17} />
        </button>
      )}
      {onArchive && (
        <button title="Archiver" onClick={onArchive} className="rounded-lg p-2 text-gray-500 hover:bg-yellow-50 hover:text-yellow-700">
          <Archive size={17} />
        </button>
      )}
      {onDelete && (
        <button title="Supprimer" onClick={onDelete} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-700">
          <Trash2 size={17} />
        </button>
      )}
    </div>
  );
}
