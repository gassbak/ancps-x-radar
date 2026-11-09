import { Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button, Badge, Table, EmptyState } from "../ui";
import { IMPORT_FIELDS, IMPORT_FIELD_LABELS } from "./importFields";

export default function ImportPreviewTable({ rows, preview, errors, done, onValidate, onImport }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold">Prévisualisation</h2>
          <p className="text-sm text-gray-500">{rows.length} ligne(s) détectée(s).</p>
        </div>

        {rows.length > 0 && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onValidate}><AlertTriangle size={16} /> Valider</Button>
            <Button onClick={onImport}><Upload size={16} /> Importer</Button>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">
          <b>Rapport d'erreurs</b>
          <ul className="mt-2 list-disc pl-5">
            {errors.slice(0, 15).map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {done && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 size={18} /> Import terminé. Les fiches sont créées en brouillon pour vérification avant publication.
        </div>
      )}

      {rows.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="Aucun fichier importé" text="Chargez un fichier pour commencer le mapping." />
        </div>
      ) : (
        <div className="mt-5 overflow-auto">
          <Table headers={IMPORT_FIELDS.map((f) => IMPORT_FIELD_LABELS[f]).concat(["Contrôles"])}>
            {preview.slice(0, 100).map((row) => (
              <tr key={row._row} className={row._invalid || row._duplicate ? "bg-red-50" : ""}>
                {IMPORT_FIELDS.map((field) => (
                  <td key={field} className="px-4 py-3 text-xs">{row[field] || "—"}</td>
                ))}
                <td className="px-4 py-3">
                  {row._invalid ? (
                    <Badge tone="red">Invalide</Badge>
                  ) : row._duplicate ? (
                    <Badge tone="yellow">Doublon</Badge>
                  ) : (
                    <Badge tone="green">OK</Badge>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}
    </div>
  );
}
