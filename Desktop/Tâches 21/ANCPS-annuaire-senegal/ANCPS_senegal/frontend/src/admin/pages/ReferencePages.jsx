import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { loadReference, saveReference, removeReference } from "../services/adminApi";
import {
  PageHeader,
  Button,
  SearchBar,
  Badge,
  Table,
  RowActions,
  Modal,
  Input,
  Select,
  Textarea,
  EmptyState,
} from "../components/ui";

// Configuration des 4 référentiels partageant la même page générique.
// Les champs correspondent à ceux du backend (voir adminApi.js).
const REFERENCE_CONFIGS = {
  organizations: {
    title: "Organismes certificateurs",
    desc: "Organismes qui délivrent les certifications.",
    name: "organisme",
    fields: [
      ["name", "Nom"],
      ["type", "Type"],
      ["country", "Pays"],
      ["website", "Site web"],
      ["description", "Description"],
    ],
    types: ["Public", "Privé", "ONG"],
  },
  establishments: {
    title: "Établissements",
    desc: "Établissements qui préparent les certifications.",
    name: "établissement",
    fields: [
      ["name", "Nom"],
      ["type", "Statut public / privé"],
      ["region", "Région"],
      ["city", "Ville"],
      ["address", "Adresse"],
      ["website", "Site web"],
      ["description", "Description"],
    ],
    types: ["Public", "Privé"],
  },
  jobs: {
    title: "Métiers",
    desc: "Référentiel des métiers associés aux compétences et certifications.",
    name: "métier",
    fields: [
      ["name", "Intitulé"],
      ["description", "Description"],
    ],
  },
  skills: {
    title: "Compétences",
    desc: "Référentiel des compétences associées aux métiers et certifications.",
    name: "compétence",
    fields: [
      ["name", "Nom"],
      ["description", "Description"],
    ],
  },
};

export default function ReferencePages({ type }) {
  const config = REFERENCE_CONFIGS[type];

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({});

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await loadReference(type));
    } catch (error) {
      alert(error.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    reload();
  }, [reload]);

  const list = useMemo(
    () => data.filter((item) => Object.values(item).join(" ").toLowerCase().includes(query.toLowerCase())),
    [data, query]
  );

  const openForm = (item) => {
    setForm(item ? { ...item } : { id: undefined, name: "", type: config.types?.[0] || "", description: "" });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name?.trim()) {
      alert("Le nom est obligatoire.");
      return;
    }

    try {
      await saveReference(type, form);
      setModalOpen(false);
      await reload();
    } catch (error) {
      alert(error.message);
    }
  };

  const remove = async (id) => {
    if (!confirm("Supprimer cet élément ?")) return;

    try {
      await removeReference(type, id);
      await reload();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div>
      <PageHeader
        title={config.title}
        description={config.desc}
        action={<Button icon={Plus} onClick={() => openForm()}>Ajouter un {config.name}</Button>}
      />

      <div className="mb-5">
        <SearchBar value={query} onChange={setQuery} placeholder={`Rechercher un ${config.name}...`} />
      </div>

      {loading ? (
        <p className="py-10 text-center text-gray-500">Chargement...</p>
      ) : list.length === 0 ? (
        <EmptyState />
      ) : (
        <Table headers={[config.fields[0][1], "Informations", "Statut", "Actions"]}>
          {list.map((item) => (
            <tr key={item.id}>
              <td className="px-5 py-4">
                <p className="font-bold">{item.name}</p>
                <p className="text-xs text-gray-500">{item.id}</p>
              </td>
              <td className="px-5 py-4 text-gray-600">
                {config.fields.slice(1, 4).map(([key, label]) => (
                  <div key={key} className="text-xs">
                    {label}: {item[key] || "—"}
                  </div>
                ))}
              </td>
              <td className="px-5 py-4">
                <Badge tone="green">{item.status || "Actif"}</Badge>
              </td>
              <td className="px-5 py-4">
                <RowActions onEdit={() => openForm(item)} onDelete={() => remove(item.id)} />
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? `Modifier ${config.name}` : `Nouveau ${config.name}`}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {config.fields.map(([key, label]) => {
            if (key === "description") {
              return (
                <Textarea
                  key={key}
                  label={label}
                  className="md:col-span-2"
                  rows={4}
                  value={form[key] || ""}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              );
            }

            if (key === "type" && config.types) {
              return (
                <Select
                  key={key}
                  label={label}
                  value={form[key] || config.types[0]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  options={config.types}
                />
              );
            }

            return (
              <Input
                key={key}
                label={label}
                value={form[key] || ""}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            );
          })}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
          <Button onClick={save}>Enregistrer</Button>
        </div>
      </Modal>
    </div>
  );
}