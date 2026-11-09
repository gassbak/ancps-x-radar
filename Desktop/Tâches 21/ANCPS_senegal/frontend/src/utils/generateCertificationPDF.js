
import jsPDF from "jspdf";

export function downloadCertificationPDF(certification) {
    const doc = new jsPDF();

    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    const margin = 20;
    let y = 20;

    const green = [6, 78, 59];
    const dark = [15, 23, 42];
    const gray = [100, 116, 139];
    const light = [236, 253, 245];

    const organisme =
        certification.organisme?.nom ||
        "Organisme non renseigné";

    const niveau =
        certification.niveau ||
        certification.niveauSortie?.nom ||
        "Non renseigné";

    const addPage = () => {
        if (y > height - 30) {
            doc.addPage();
            y = 20;
        }
    };

    const title = (text) => {
        addPage();

        doc.setFillColor(...light);
        doc.roundedRect(
            margin,
            y,
            width - margin * 2,
            10,
            2,
            2,
            "F"
        );

        doc.setTextColor(...green);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(text, margin + 5, y + 7);

        y += 18;
    };

    const text = (value) => {
        const lines = doc.splitTextToSize(
            String(value || "Non renseigné"),
            width - margin * 2
        );

        doc.setTextColor(...dark);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        lines.forEach((line) => {
            addPage();
            doc.text(line, margin, y);
            y += 6;
        });

        y += 4;
    };

    // En-tête
    doc.setFillColor(...green);
    doc.rect(0, 0, width, 38, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("ANCPS", margin, 17);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
        "Annuaire des Certifications du Sénégal",
        margin,
        27
    );

    y = 52;

    // Titre
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);

    doc.text(
        "FICHE DE CERTIFICATION",
        margin,
        y
    );

    y += 15;

    doc.setTextColor(...green);
    doc.setFontSize(15);

    const name = doc.splitTextToSize(
        certification.title || "Certification",
        width - margin * 2
    );

    name.forEach((line) => {
        doc.text(line, margin, y);
        y += 8;
    });

    y += 8;

    // Informations
    title("Informations générales");

    text(`Sigle : ${certification.sigle || "Non renseigné"}`);
    text(`Organisme : ${organisme}`);

    text(
        `Domaine : ${
            certification.domaine?.nom ||
            certification.domaine ||
            certification.sector ||
            "Non renseigné"
        }`
    );

    text(
        `Type : ${
            certification.type?.nom ||
            certification.nature?.nom ||
            "Certification"
        }`
    );

    text(`Niveau : ${niveau}`);
    text(`Durée : ${certification.duree || "Non renseignée"}`);
    text(`Modalité : ${certification.modalite || "Non renseignée"}`);

    // Présentation
    title("Présentation");

    text(
        certification.description ||
        "Aucune description disponible."
    );

    // Objectifs
    title("Objectifs de la formation");

    text(
        certification.objectifs ||
        "Objectifs non renseignés."
    );

    // Compétences
    title("Blocs de compétences");

    if (certification.competencesLibres?.length) {
        certification.competencesLibres.forEach(
            (competence) => {
                text(`• ${competence}`);
            }
        );
    } else {
        text("Aucun bloc de compétences renseigné.");
    }

    // Métiers
    if (certification.metiers?.length) {
        title("Métiers associés");

        text(
            certification.metiers
                .map((item) => item.nom || item)
                .join(", ")
        );
    }

    // Établissements
    if (certification.etablissements?.length) {
        title("Établissements");

        text(
            certification.etablissements
                .map((item) => item.nom || item)
                .join(", ")
        );
    }

    // Pied de page
    const pages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= pages; i++) {
        doc.setPage(i);

        doc.setFontSize(8);
        doc.setTextColor(...gray);

        doc.text(
            "Annuaire des Certifications du Sénégal — ANCPS",
            margin,
            height - 10
        );

        doc.text(
            `Page ${i} / ${pages}`,
            width - margin,
            height - 10,
            { align: "right" }
        );
    }

    const filename =
        (certification.title || "certification")
            .replace(/[^a-z0-9]/gi, "_")
            .toLowerCase();

    doc.save(`${filename}_ANCPS.pdf`);
}

