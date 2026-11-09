import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { can } from "../services/adminStore";
import { loadRequests, createRequest, setRequestStatus } from "../services/adminApi";
import { PageHeader, SearchBar, Table, Badge, Button, Modal, Input, Select, Textarea, statusTone, EmptyState } from "../components/ui";

const EMPTY_REQUEST_FORM = { type: "Nouvelle certification", entity: "", note: "" };

export default function RequestsPage({ session }) {
  const [requests, setRequests] = useState([]);
  const [query, setQuery] = useState("");
  const [viewed, setViewed] = useState(null);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_REQUEST_FORM);

  const reload = useCallback(async () => {
    try {
      setRequests(await loadRequests());
    } catch {
      setRequests([]);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const list = requests.filter((r) =>
    `${r.entity} ${r.requester} ${r.type}`.toLowerCase().includes(query.toLowerCase())
  );

  const submitRequest = async () => {
    try {
      await createRequest(form);
      setNewModalOpen(false);
      setForm(EMPTY_REQUEST_FORM);
      await reload();
      window.dispatchEvent(new Event("ancps-store-change"));
    } catch (error) {
      alert(error.message);
    }
  };

  // Fait avancer une demande (accepter / compléter / rejeter). Le backend
  // journalise le changement et notifie l'auteur.
  const applyDecision = async (request, status) => {
    try {
      await setRequestStatus(request.id, status);
      setViewed(null);
      await reload();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Demandes à vérifier"
        description="Contributions externes : accepter, demander un complément ou rejeter."
        action={
          can(session.role, "requests.create") && (
            <Button onClick={() => setNewModalOpen(true)}>Nouvelle demande</Button>
          )
        }
      />

      <div className="mb-5">
        <SearchBar value={query} onChange={setQuery} placeholder="Rechercher une demande..." />
      </div>

      {list.length === 0 ? (
        <EmptyState />
      ) : (
        <Table headers={["Demande", "Demandeur", "Date", "Priorité", "Statut", "Action"]}>
          {list.map((r) => (
            <tr key={r.id}>
              <td className="px-5 py-4">
                <button onClick={() => setViewed(r)} className="text-left font-bold hover:text-emerald-700">
                  {r.entity}
                  <p className="text-xs font-normal text-gray-500">{r.type}</p>
                </button>
              </td>
              <td className="px-5 py-4">{r.requester}</td>
              <td className="px-5 py-4 text-gray-500">{r.submittedAt}</td>
              <td className="px-5 py-4">
                <Badge tone={r.priority === "Haute" ? "red" : "gray"}>{r.priority}</Badge>
              </td>
              <td className="px-5 py-4">
                <Badge tone={statusTone(r.status)}>{r.status}</Badge>
              </td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-1">
                  <button onClick={() => setViewed(r)} className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                    <Check size={17} />
                  </button>
                  <button onClick={() => applyDecision(r, "Complément demandé")} className="rounded-lg bg-yellow-50 p-2 text-yellow-700">
                    ?
                  </button>
                  <button onClick={() => applyDecision(r, "Rejetée")} className="rounded-lg bg-red-50 p-2 text-red-700">
                    <X size={17} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={!!viewed} onClose={() => setViewed(null)} title="Dossier de contribution" wide>
        {viewed && (
          <div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500">Entité</p>
                <p className="font-bold">{viewed.entity}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Demandeur</p>
                <p className="font-bold">{viewed.requester}</p>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">{viewed.note || "Aucune note."}</div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => applyDecision(viewed, "Complément demandé")}>
                Demander un complément
              </Button>
              <Button variant="danger" onClick={() => applyDecision(viewed, "Rejetée")}>Rejeter</Button>
              <Button onClick={() => applyDecision(viewed, "Acceptée")}>Valider</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={newModalOpen} onClose={() => setNewModalOpen(false)} title="Nouvelle demande de contribution">
        <div className="space-y-4">
          <Select
            label="Type de demande"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={["Nouvelle certification", "Mise à jour d'une fiche", "Nouvel établissement", "Document justificatif"]}
          />

          <Input
            label="Entité concernée *"
            placeholder="Ex : BTS Informatique de gestion"
            value={form.entity}
            onChange={(e) => setForm({ ...form, entity: e.target.value })}
          />

          <Textarea
            label="Note / justificatifs"
            rows={4}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setNewModalOpen(false)}>Annuler</Button>
            <Button disabled={!form.entity} onClick={submitRequest}>Soumettre</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
