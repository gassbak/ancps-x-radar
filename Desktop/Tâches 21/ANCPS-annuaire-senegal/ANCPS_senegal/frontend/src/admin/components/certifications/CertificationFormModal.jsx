import { Modal, Input, Select, Textarea, MultiSelect, Badge, Button, statusTone } from "../ui";
import { VERIFICATION_STATUSES } from "./certificationDefaults";

export default function CertificationFormModal({
  open,
  onClose,
  form,
  setForm,
  newDecision,
  setNewDecision,
  onAddDecision,
  onSave,
  domains,
  levels,
  organizations,
  establishments,
  jobs,
  skillsRef,
  sources,
}) {
  const setField = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <Modal open={open} onClose={onClose} title={form.id ? "Modifier la certification" : "Nouvelle certification"} wide>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Input label="Intitulé *" value={form.title} onChange={setField("title")} />
        <Input label="Sigle" value={form.acronym} onChange={setField("acronym")} />
        <Input label="Code" value={form.code} onChange={setField("code")} />

        <Select
          label="Type"
          value={form.type}
          onChange={setField("type")}
          options={["Formation professionnelle et technique", "Enseignement supérieur", "Certification professionnelle privée", "Certification professionnelle"]}
        />

        <Select label="Domaine" value={form.domain} onChange={setField("domain")} options={domains} />
        <Input label="Sous-domaine" value={form.subdomain} onChange={setField("subdomain")} />
        <Select label="Niveau" value={form.level} onChange={setField("level")} options={levels} />
        <Input label="Niveau d'entrée" value={form.entryLevel} onChange={setField("entryLevel")} />
        <Input label="Niveau de sortie" value={form.exitLevel} onChange={setField("exitLevel")} />
        <Input label="Durée" value={form.duration} onChange={setField("duration")} />
        <Input label="Volume horaire" value={form.hours} onChange={setField("hours")} />
        <Select label="Modalité" value={form.format} onChange={setField("format")} options={["Présentiel", "Distance", "Hybride"]} />

        <Select
          label="Statut de vérification"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value, verificationStatus: e.target.value })}
          options={VERIFICATION_STATUSES}
        />

        <Select label="Nature" value={form.nature} onChange={setField("nature")} options={["Diplôme national", "Certification professionnelle", "Certification privée"]} />

        <Select
          label="Organisme certificateur"
          value={form.organizationId}
          onChange={(e) => {
            const org = organizations.find((x) => x.id === e.target.value);
            setForm({ ...form, organizationId: e.target.value, organizationName: org?.name || "" });
          }}
          options={[{ value: "", label: "— Choisir —" }, ...organizations.map((o) => ({ value: o.id, label: o.name }))]}
        />

        <Textarea label="Description" className="md:col-span-2" rows={4} value={form.description} onChange={setField("description")} />
        <Textarea label="Objectifs — un par ligne" rows={4} value={form.objectives} onChange={setField("objectives")} />
        <Textarea label="Compétences — une par ligne" rows={4} value={form.skills} onChange={setField("skills")} />

        <MultiSelect
          label="Compétences du référentiel"
          value={form.skillIds}
          onChange={(v) => setForm({ ...form, skillIds: v })}
          options={skillsRef.map((s) => ({ value: s.id, label: s.name }))}
        />
        <MultiSelect
          label="Débouchés — métiers accessibles"
          value={form.jobIds}
          onChange={(v) => setForm({ ...form, jobIds: v })}
          options={jobs.map((j) => ({ value: j.id, label: j.name }))}
        />
        <MultiSelect
          label="Où se former — établissements"
          value={form.establishmentIds}
          onChange={(v) => setForm({ ...form, establishmentIds: v })}
          options={establishments.map((e) => ({ value: e.id, label: e.name }))}
        />
      </div>

      <div className="mt-6 rounded-xl border p-4">
        <h3 className="font-bold">Décisions & sources</h3>
        <p className="mt-1 text-xs text-gray-500">
          Chaque décision est conservée : une nouvelle décision s'ajoute à l'historique, elle n'efface jamais les précédentes.
        </p>

        {form.decisions.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">Aucune décision enregistrée pour le moment.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {form.decisions.map((d) => (
              <div key={d.id} className="rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                <span className="ml-2">Autorité : <b>{d.authority || "—"}</b></span>
                <span className="ml-2">Référence : <b>{d.decisionRef || "—"}</b></span>
                <span className="ml-2">Date : <b>{d.decisionDate || "—"}</b></span>
                <span className="ml-2">Validité : <b>{d.validFrom || "—"} → {d.validTo || "—"}</b></span>
                <span className="ml-2">Source : <b>{sources.find((s) => s.id === d.sourceId)?.name || "—"}</b></span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg bg-emerald-50 p-3 sm:grid-cols-3">
          <Select
            label="Statut résultant"
            value={newDecision.status}
            onChange={(e) => setNewDecision({ ...newDecision, status: e.target.value })}
            options={VERIFICATION_STATUSES}
          />
          <Input label="Autorité" value={newDecision.authority} onChange={(e) => setNewDecision({ ...newDecision, authority: e.target.value })} />
          <Input label="Référence décision / arrêté" value={newDecision.decisionRef} onChange={(e) => setNewDecision({ ...newDecision, decisionRef: e.target.value })} />
          <Input label="Date de décision" type="date" value={newDecision.decisionDate} onChange={(e) => setNewDecision({ ...newDecision, decisionDate: e.target.value })} />
          <Input label="Début de validité" type="date" value={newDecision.validFrom} onChange={(e) => setNewDecision({ ...newDecision, validFrom: e.target.value })} />
          <Input label="Fin de validité" type="date" value={newDecision.validTo} onChange={(e) => setNewDecision({ ...newDecision, validTo: e.target.value })} />
          <Select
            label="Source / preuve"
            value={newDecision.sourceId}
            onChange={(e) => setNewDecision({ ...newDecision, sourceId: e.target.value })}
            options={[{ value: "", label: "— Aucune —" }, ...sources.map((s) => ({ value: s.id, label: s.name }))]}
          />
          <div className="flex items-end">
            <Button variant="secondary" onClick={onAddDecision}>Ajouter la décision</Button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-xl bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={!!form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Publier cette fiche
        </label>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={onSave}>Enregistrer</Button>
        </div>
      </div>
    </Modal>
  );
}
