import { Eye, Copy } from "lucide-react";
import { Badge, Table, RowActions, EmptyState, statusTone } from "../ui";

export default function CertificationTable({ list, onView, onPublishToggle, onDuplicate, onEdit, onArchive, onDelete }) {
  if (list.length === 0) {
    return <EmptyState title="Aucune certification" text="Modifiez votre recherche ou créez une nouvelle fiche." />;
  }

  return (
    <Table headers={["Certification", "Type / niveau", "Domaine", "Statut", "Mise à jour", "Actions"]}>
      {list.map((c) => (
        <tr key={c.id} className="hover:bg-gray-50">
          <td className="px-5 py-4">
            <button onClick={() => onView(c)} className="text-left">
              <p className="font-bold text-gray-900 hover:text-emerald-700">{c.title}</p>
              <p className="text-xs text-gray-500">{c.code} · {c.organizationName}</p>
            </button>
          </td>

          <td className="px-5 py-4">
            <p>{c.type}</p>
            <p className="text-xs text-gray-500">{c.level}</p>
          </td>

          <td className="px-5 py-4 text-gray-600">{c.domain}</td>

          <td className="px-5 py-4">
            <div className="space-y-1">
              <Badge tone={statusTone(c.status)}>{c.status}</Badge>
              {c.published && <Badge tone="green">Publié</Badge>}
            </div>
          </td>

          <td className="px-5 py-4 text-gray-500">{c.updatedAt}</td>

          <td className="px-5 py-4">
            <div className="flex justify-end gap-1">
              <button title="Publier / dépublier" onClick={() => onPublishToggle(c)} className="rounded-lg p-2 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700">
                <Eye size={17} />
              </button>
              <button title="Dupliquer" onClick={() => onDuplicate(c)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                <Copy size={17} />
              </button>
              <RowActions onEdit={() => onEdit(c)} onArchive={!c.archived ? () => onArchive(c) : undefined} onDelete={() => onDelete(c.id)} />
            </div>
          </td>
        </tr>
      ))}
    </Table>
  );
}
