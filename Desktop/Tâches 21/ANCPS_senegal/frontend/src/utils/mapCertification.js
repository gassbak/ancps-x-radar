const MODALITES = {
    presentiel: "Présentiel",
    distance: "À distance",
    hybride: "Hybride",
};

export function mapCertification(c) {
    return {
        id: c._id,
        title: c.title,
        sigle: c.sigle || "",
        description: c.description || "",

        type:
            c.type?.nom ||
            c.nature?.nom ||
            "Certification",

        niveau:
            c.niveau ||
            c.niveauSortie?.nom ||
            "",

        mode:
            MODALITES[c.modalite] ||
            c.modalite ||
            "",

        organization:
            c.organisme?.nom ||
            "",

        sector:
            c.domaine?.nom ||
            c.domaine ||
            "",

        duration:
            c.duree ||
            "",

        raw: c,
    };
}