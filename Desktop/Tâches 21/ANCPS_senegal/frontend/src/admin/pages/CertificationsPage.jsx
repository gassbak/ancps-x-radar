import { Plus, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Button } from "../components/ui";
import CertificationFilters from "../components/certifications/CertificationFilters";
import CertificationTable from "../components/certifications/CertificationTable";
import CertificationFormModal from "../components/certifications/CertificationFormModal";
import CertificationPreviewModal from "../components/certifications/CertificationPreviewModal";
import { useCertifications } from "../hooks/useCertifications";

export default function CertificationsPage({ session }) {
  const navigate = useNavigate();
  const certifications = useCertifications(session);

  return (
    <div>
      <PageHeader
        title="Certifications"
        description="Créer, modifier, dupliquer, publier, dépublier, archiver et supprimer les certifications."
        action={
          <div className="flex gap-2">
            <Button icon={Upload} variant="secondary" onClick={() => navigate("/admin/imports")}>Importer</Button>
            <Button icon={Plus} onClick={certifications.openCreate}>Ajouter une certification</Button>
          </div>
        }
      />

      <CertificationFilters
        search={certifications.search}
        onSearchChange={certifications.setSearch}
        status={certifications.statusFilter}
        onStatusChange={certifications.setStatusFilter}
        statuses={certifications.statuses}
      />

      <CertificationTable
        list={certifications.list}
        onView={certifications.setViewedCertification}
        onPublishToggle={certifications.publish}
        onDuplicate={certifications.openDuplicate}
        onEdit={certifications.openEdit}
        onArchive={certifications.archive}
        onDelete={certifications.remove}
      />

      <CertificationFormModal
        open={certifications.formModalOpen}
        onClose={() => certifications.setFormModalOpen(false)}
        form={certifications.form}
        setForm={certifications.setForm}
        newDecision={certifications.newDecision}
        setNewDecision={certifications.setNewDecision}
        onAddDecision={certifications.addDecision}
        onSave={certifications.save}
        domains={certifications.domains}
        levels={certifications.levels}
        organizations={certifications.organizations}
        establishments={certifications.establishments}
        jobs={certifications.jobs}
        skillsRef={certifications.skillsRef}
        sources={certifications.sources}
      />

      <CertificationPreviewModal
        certification={certifications.viewedCertification}
        onClose={() => certifications.setViewedCertification(null)}
        jobs={certifications.jobs}
        establishments={certifications.establishments}
        skillsRef={certifications.skillsRef}
        sources={certifications.sources}
      />
    </div>
  );
}
