import { FileSpreadsheet } from "lucide-react";
import { Select } from "../ui";
import { IMPORT_FIELDS, IMPORT_FIELD_LABELS } from "./importFields";

export default function ImportUploadPanel({ headers, mapping, onFile, onMappingChange }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-1">
      <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
        <FileSpreadsheet className="mx-auto text-emerald-700" size={35} />
        <p className="mt-3 font-bold">Déposer un CSV ou Excel</p>
        <p className="mt-1 text-xs text-gray-500">La première feuille est utilisée.</p>

        <label className="mt-5 inline-flex cursor-pointer">
          <span className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Choisir un fichier</span>
          <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onFile} />
        </label>
      </div>

      {headers.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="font-bold">Mapping</h3>
          {IMPORT_FIELDS.map((field) => (
            <Select
              key={field}
              label={IMPORT_FIELD_LABELS[field]}
              value={mapping[field] || ""}
              onChange={(e) => onMappingChange({ ...mapping, [field]: e.target.value })}
              options={["", ...headers]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
