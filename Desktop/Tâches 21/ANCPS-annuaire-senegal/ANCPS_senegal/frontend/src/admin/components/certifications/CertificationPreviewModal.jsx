import { Modal, Badge, statusTone } from "../ui";
import { latestDecision } from "./certificationDefaults";

export default function CertificationPreviewModal({ certification, onClose, jobs, establishments, skillsRef, sources }) {
  if (!certification) {
    return <Modal open={false} onClose={onClose} title="Aperçu de la certification" wide />;
  }

  const c = certification;
  const linkedSkills = (c.skillIds || []).map((id) => skillsRef.find((s) => s.id === id)).filter(Boolean);
  const linkedJobs = (c.jobIds || []).map((id) => jobs.find((j) => j.id === id)).filter(Boolean);
  const linkedEstablishments = (c.establishmentIds || []).map((id) => establishments.find((e) => e.id === id)).filter(Boolean);

  return (
    <Modal open={!!certification} onClose={onClose} title="Aperçu de la certification" wide>
      <div className="space-y-6">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="green">{c.domain}</Badge>
            <Badge tone="blue">{c.level}</Badge>
            <Badge tone="purple">{c.nature || "—"}</Badge>
            <Badge tone={statusTone(c.status)}>{c.status}</Badge>
          </div>
          <h2 className="mt-3 text-2xl font-extrabold">{c.title}</h2>
          <p className="mt-1 text-sm text-gray-500">{c.organizationName} · {c.code}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Durée", c.duration || "—"],
            ["Modalité", c.format || "—"],
            ["Validité", latestDecision(c)?.validTo || "—"],
          ].map(([label, value]) => (
            <div className="rounded-xl bg-gray-50 p-4" key={label}>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="mt-1 font-bold">{value}</p>
            </div>
          ))}
        </div>

        <div>
          <h3 className="font-bold">Description</h3>
          <p className="mt-2 leading-7 text-gray-600">{c.description || "—"}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-bold">Objectifs</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
              {(c.objectives || []).map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold">Compétences</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {(c.skills || []).map((skill) => (
                <Badge key={skill} tone="gray">{skill}</Badge>
              ))}
              {linkedSkills.map((skill) => (
                <Badge key={skill.id} tone="blue">{skill.name}</Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-bold">Débouchés — métiers</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {linkedJobs.map((job) => (
                <Badge key={job.id} tone="yellow">{job.name}</Badge>
              ))}
              {linkedJobs.length === 0 && <p className="text-sm text-gray-400">Aucun métier associé.</p>}
            </div>
          </div>

          <div>
            <h3 className="font-bold">Où se former</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {linkedEstablishments.map((establishment) => (
                <Badge key={establishment.id} tone="gray">{establishment.name}</Badge>
              ))}
              {linkedEstablishments.length === 0 && <p className="text-sm text-gray-400">Aucun établissement associé.</p>}
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-bold">Historique des décisions & sources</h3>
          {(c.decisions || []).length === 0 ? (
            <p className="mt-2 text-sm text-gray-400">Aucune décision enregistrée.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {c.decisions.map((d) => (
                <div key={d.id} className="rounded-xl bg-emerald-50 p-4 text-sm">
                  <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                  <span className="ml-2">Organisme certificateur : <b>{c.organizationName || "—"}</b></span>
                  <span className="ml-2">Autorité / source : <b>{d.authority || "—"}</b></span>
                  <span className="ml-2">Référence : <b>{d.decisionRef || "—"}</b></span>
                  <span className="ml-2">Date : <b>{d.decisionDate || "—"}</b></span>
                  <span className="ml-2">Validité : <b>{d.validFrom || "—"} → {d.validTo || "—"}</b></span>
                  <span className="ml-2">Preuve : <b>{sources.find((s) => s.id === d.sourceId)?.name || "Aucune"}</b></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
