import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { saveCertification } from "../services/adminApi";
import { PageHeader } from "../components/ui";
import ImportUploadPanel from "../components/imports/ImportUploadPanel";
import ImportPreviewTable from "../components/imports/ImportPreviewTable";
import { IMPORT_FIELDS } from "../components/imports/importFields";

// Devine automatiquement quelle colonne du fichier correspond à quel champ,
// à partir de mots-clés usuels dans les exports du terrain.
function guessMapping(headers) {
  const guessFor = (field) => {
    if (field === "title") return headers.find((h) => h.toLowerCase().includes("diplôme"));
    if (field === "organizationName") return headers.find((h) => h.toLowerCase().includes("école"));
    return headers.find((h) => h.toLowerCase().includes(field));
  };

  return Object.fromEntries(IMPORT_FIELDS.map((field) => [field, guessFor(field) || ""]));
}

export default function ImportPage({ session }) {
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [errors, setErrors] = useState([]);
  const [done, setDone] = useState(false);

  const onFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      try {
        const workbook = XLSX.read(loadEvent.target.result, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        const detectedHeaders = data.length ? Object.keys(data[0]) : [];

        setHeaders(detectedHeaders);
        setRows(data);
        setMapping(guessMapping(detectedHeaders));
        setErrors([]);
        setDone(false);
      } catch {
        setErrors(["Fichier illisible."]);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Applique le mapping colonne -> champ et détecte doublons / lignes invalides.
  const preview = useMemo(() => {
    return rows.map((row, index) => {
      const mapped = {};

      IMPORT_FIELDS.forEach((field) => {
        mapped[field] = row[mapping[field]] ?? "";
      });

      const isDuplicate =
        mapped.title &&
        rows.slice(0, index).some((other) => (other[mapping.title] || "").toLowerCase().trim() === mapped.title.toLowerCase().trim());

      return { ...mapped, _row: index + 2, _duplicate: isDuplicate, _invalid: !mapped.title };
    });
  }, [rows, mapping]);

  const validate = () => {
    const nextErrors = preview
      .filter((row) => row._invalid || row._duplicate)
      .map((row) => `Ligne ${row._row}: ${row._invalid ? "intitulé manquant" : ""}${row._duplicate ? " doublon détecté" : ""}`);

    setErrors(nextErrors);
    return nextErrors;
  };

  const importNow = async () => {
    if (validate().length > 0) return;

    try {
      for (const row of preview) {
        await saveCertification({
          title: row.title,
          organizationName: row.organizationName,
          domain: row.domain || "Non classé",
          level: row.level || "",
          duration: row.duration,
          status: row.status || "En cours de vérification",
          published: false,
          archived: false,
          decisions: [],
        });
      }
      setDone(true);
    } catch (error) {
      setErrors([error.message]);
    }
  };

  return (
    <div>
      <PageHeader
        title="Import massif"
        description="CSV / Excel : mapping des colonnes, prévisualisation, validation, doublons et rapport d'erreurs."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <ImportUploadPanel headers={headers} mapping={mapping} onFile={onFile} onMappingChange={setMapping} />
        <ImportPreviewTable rows={rows} preview={preview} errors={errors} done={done} onValidate={validate} onImport={importNow} />
      </div>
    </div>
  );
}
