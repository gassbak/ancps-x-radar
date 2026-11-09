
import { request } from "../../services/api";

/* ==============================
   UTILITAIRES
============================== */

const json = (data) => JSON.stringify(data);

const day = (d) => (
  d ? String(d).slice(0, 10) : ""
);

const idOf = (value) => (
  value && typeof value === "object"
    ? value._id
    : value
) || "";

const lines = (value) => (
  Array.isArray(value)
    ? value
    : String(value || "").split("\n")
)
  .map((x) => String(x).trim())
  .filter(Boolean);

const safeList = (path) => (
  request(path).catch(() => [])
);

/*
 * Les créations de domaines / métiers /
 * compétences peuvent renvoyer :
 *
 * { message, objet }
 *
 * ou directement :
 *
 * { _id, nom }
 */
const unwrap = (res) => {
  if (res && res._id) {
    return res;
  }

  return Object.values(res || {}).find(
    (value) =>
      value &&
      typeof value === "object" &&
      value._id
  );
};


/* ==============================
   DOMAINES / NIVEAUX
============================== */

export const DEFAULT_DOMAINS = [
  "Numérique et informatique",
  "Gestion et management",
  "Santé et social",
  "Industrie et BTP",
  "Agriculture et environnement",
  "Commerce et marketing",
];

export const DEFAULT_LEVELS = [
  "Certification Professionnelle",
  "BTS",
  "Licence",
  "Master",
  "Doctorat",
];

const MODALITE_TO_BACK = {
  Présentiel: "presentiel",
  Distance: "distance",
  Hybride: "hybride",
};

const MODALITE_TO_FRONT = {
  presentiel: "Présentiel",
  distance: "Distance",
  hybride: "Hybride",
};


/*
 * Cherche un élément d'une nomenclature
 * par son nom et le crée s'il n'existe pas.
 */
async function ensure(path, nom, extra = {}) {
  const name = String(nom || "").trim();

  if (!name) {
    return undefined;
  }

  const items = await request(path);

  const found = items.find(
    (item) =>
      String(item.nom || "")
        .trim()
        .toLowerCase() === name.toLowerCase() &&
      (
        !extra.domaine ||
        idOf(item.domaine) === extra.domaine
      )
  );

  if (found) {
    return found._id;
  }

  const created = unwrap(
    await request(path, {
      method: "POST",
      body: json({
        nom: name,
        ...extra,
      }),
    })
  );

  return created?._id;
}


export async function loadNames(path) {
  const items = await safeList(path);

  return items
    .map((item) => item.nom)
    .filter(Boolean);
}


/* ==============================
   CERTIFICATIONS
============================== */

function decisionFromBack(record) {
  return {
    id: record._id,
    status: record.statut,
    authority: record.autorite,
    decisionRef: record.reference || "",
    decisionDate: "",
    validFrom: day(record.dateDebut),
    validTo: day(record.dateFin),
    sourceId: record.preuve || "",
  };
}


function certificationFromBack(
  certification,
  decisions = []
) {
  const status =
    certification.statutVerification?.nom ||
    "En cours de vérification";

  return {
    id: certification._id,

    title:
      certification.title || "",

    acronym:
      certification.sigle || "",

    code:
      certification.code || "",

    type:
      certification.type?.nom || "",

    domain:
      certification.domaine?.nom || "",

    subdomain:
      certification.sousDomaine?.nom || "",

    level:
      certification.niveauSortie?.nom || "",

    entryLevel:
      certification.niveauEntree?.nom || "",

    exitLevel:
      certification.niveauSortie?.nom || "",

    duration:
      certification.duree || "",

    hours:
      certification.volumeHoraire || "",

    format:
      MODALITE_TO_FRONT[certification.modalite] ||
      "Présentiel",

    nature:
      certification.nature?.nom || "",

    description:
      certification.description || "",

    objectives:
      lines(certification.objectifs),

    skills:
      certification.competencesLibres || [],

    organizationId:
      idOf(certification.organisme),

    organizationName:
      certification.organisme?.nom || "",

    status,

    verificationStatus:
      status,

    decisions,

    establishmentIds:
      (certification.etablissements || [])
        .map(idOf),

    jobIds:
      (certification.metiers || [])
        .map(idOf),

    skillIds:
      (certification.competences || [])
        .map(idOf),

    published:
      !!certification.published,

    archived:
      !!certification.archived,

    createdAt:
      day(certification.createdAt),

    updatedAt:
      day(certification.updatedAt),
  };
}


async function certificationToBack(form) {
  const domaine = await ensure(
    "/domaines",
    form.domain
  );

  const sousDomaine =
    form.subdomain && domaine
      ? await ensure(
          "/domaines/sous-domaines",
          form.subdomain,
          { domaine }
        )
      : undefined;

  let organisme =
    form.organizationId || undefined;

  if (
    !organisme &&
    form.organizationName
  ) {
    organisme = await ensure(
      "/organismes",
      form.organizationName
    );
  }

  return {
    title: form.title,
    sigle: form.acronym,
    code: form.code,

    description:
      form.description,

    objectifs:
      lines(form.objectives).join("\n"),

    competencesLibres:
      lines(form.skills),

    duree:
      form.duration,

    volumeHoraire:
      form.hours,

    modalite:
      MODALITE_TO_BACK[form.format],

    domaine,

    sousDomaine,

    type:
      await ensure(
        "/types-certification",
        form.type
      ),

    nature:
      await ensure(
        "/natures-certification",
        form.nature
      ),

    statutVerification:
      await ensure(
        "/statuts-verification",
        form.status
      ),

    niveauEntree:
      await ensure(
        "/niveaux",
        form.entryLevel
      ),

    niveauSortie:
      await ensure(
        "/niveaux",
        form.exitLevel || form.level
      ),

    organisme,

    etablissements:
      form.establishmentIds || [],

    metiers:
      form.jobIds || [],

    competences:
      form.skillIds || [],

    published:
      !!form.published,

    archived:
      !!form.archived,
  };
}


export async function loadCertifications() {
  const [
    response,
    recos,
  ] = await Promise.all([
    request("/certifications"),
    safeList("/reconnaissances"),
  ]);

  /*
   * L'API peut renvoyer :
   *
   * [...]
   *
   * ou :
   *
   * {
   *   data: [...],
   *   pagination: {...}
   * }
   */

  const certs =
    Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : [];

  console.log(
    "✅ Certifications reçues :",
    certs.length
  );

  const byCert = {};

  recos.forEach((record) => {
    const key =
      idOf(record.certification);

    if (!byCert[key]) {
      byCert[key] = [];
    }

    byCert[key].push(record);
  });

  return certs.map((certification) =>
    certificationFromBack(
      certification,
      (byCert[certification._id] || [])
        .sort(
          (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
        )
        .map(decisionFromBack)
    )
  );
}


export async function loadCertificationOptions() {
  const response =
    await safeList("/certifications");

  const certs =
    Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : [];

  return certs.map((certification) => ({
    id: certification._id,
    title: certification.title,
  }));
}


export async function saveCertification(form) {
  const body =
    await certificationToBack(form);

  const saved = form.id
    ? await request(
        `/certifications/${form.id}`,
        {
          method: "PUT",
          body: json(body),
        }
      )
    : await request(
        "/certifications",
        {
          method: "POST",
          body: json(body),
        }
      );

  /*
   * Les nouvelles décisions
   * deviennent des reconnaissances.
   */

  const newDecisions =
    (form.decisions || []).filter(
      (decision) =>
        String(decision.id)
          .startsWith("dec_")
    );

  for (const decision of newDecisions) {
    await request(
      "/reconnaissances",
      {
        method: "POST",

        body: json({
          type: "Décision",

          statut:
            decision.status,

          autorite:
            decision.authority ||
            "Non précisée",

          reference:
            decision.decisionRef ||
            undefined,

          dateDebut:
            decision.validFrom ||
            undefined,

          dateFin:
            decision.validTo ||
            undefined,

          preuve:
            decision.sourceId ||
            undefined,

          certification:
            saved._id,
        }),
      }
    );
  }

  return saved;
}


export async function patchCertification(
  id,
  changes
) {
  const body = {
    ...changes,
  };

  if (changes.status) {
    body.statutVerification =
      await ensure(
        "/statuts-verification",
        changes.status
      );

    delete body.status;
  }

  return request(
    `/certifications/${id}`,
    {
      method: "PUT",
      body: json(body),
    }
  );
}


export const removeCertification = (id) =>
  request(
    `/certifications/${id}`,
    {
      method: "DELETE",
    }
  );


/* ==============================
   RÉFÉRENTIELS
============================== */

const REFERENCES = {
  organizations: {
    path: "/organismes",

    fields: {
      name: "nom",
      type: "type",
      country: "pays",
      website: "siteWeb",
      description: "description",
    },
  },

  establishments: {
    path: "/etablissements",

    fields: {
      name: "nom",
      type: "type",
      region: "region",
      city: "ville",
      address: "adresse",
      website: "siteWeb",
      description: "description",
    },
  },

  jobs: {
    path: "/metiers",

    fields: {
      name: "nom",
      description: "description",
    },
  },

  skills: {
    path: "/competences",

    fields: {
      name: "nom",
      description: "description",
    },
  },
};


export async function loadReference(type) {
  const reference =
    REFERENCES[type];

  if (!reference) {
    return [];
  }

  const {
    path,
    fields,
  } = reference;

  const items =
    await request(path);

  return items.map((item) => ({
    id: item._id,

    status: "Actif",

    ...Object.fromEntries(
      Object.entries(fields).map(
        ([front, back]) => [
          front,
          item[back] || "",
        ]
      )
    ),
  }));
}


export async function saveReference(
  type,
  form
) {
  const reference =
    REFERENCES[type];

  if (!reference) {
    throw new Error(
      `Référentiel inconnu : ${type}`
    );
  }

  const {
    path,
    fields,
  } = reference;

  const body =
    Object.fromEntries(
      Object.entries(fields).map(
        ([front, back]) => [
          back,
          form[front] || "",
        ]
      )
    );

  return form.id
    ? request(
        `${path}/${form.id}`,
        {
          method: "PUT",
          body: json(body),
        }
      )
    : request(
        path,
        {
          method: "POST",
          body: json(body),
        }
      );
}


export const removeReference = (
  type,
  id
) =>
  request(
    `${REFERENCES[type].path}/${id}`,
    {
      method: "DELETE",
    }
  );


/* ==============================
   SOURCES & DOCUMENTS
============================== */

const QUALITY = {
  sources: {
    path: "/sources",

    toFront: (back) => ({
      id: back._id,
      name: back.nom,
      type: back.type || "",
      reference: back.reference || "",
      url: back.url || "",
      date: day(back.datePublication),
      certificationId:
        idOf(back.certification),
    }),

    toBack: (form) => ({
      nom: form.name,
      type: form.type || "",
      reference: form.reference || "",
      url: form.url || "",
      datePublication:
        form.date || undefined,
      certification:
        form.certificationId,
    }),
  },

  documents: {
    path: "/documents",

    toFront: (back) => ({
      id: back._id,
      name: back.titre,
      type: back.type || "",
      url: back.url || "",
      description:
        back.description || "",
      certificationId:
        idOf(back.certification),
    }),

    toBack: (form) => ({
      titre: form.name,
      type: form.type || "",
      url: form.url || "",
      description:
        form.description || "",
      certification:
        form.certificationId,
    }),
  },
};


export async function loadQuality(
  resource
) {
  const quality =
    QUALITY[resource];

  if (!quality) {
    return [];
  }

  const {
    path,
    toFront,
  } = quality;

  const response =
    await request(path);

  const items =
    Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : [];

  return items.map(toFront);
}


export async function saveQuality(
  resource,
  form
) {
  const quality =
    QUALITY[resource];

  if (!quality) {
    throw new Error(
      `Ressource inconnue : ${resource}`
    );
  }

  const {
    path,
    toBack,
  } = quality;

  const body =
    toBack(form);

  return form.id
    ? request(
        `${path}/${form.id}`,
        {
          method: "PUT",
          body: json(body),
        }
      )
    : request(
        path,
        {
          method: "POST",
          body: json(body),
        }
      );
}


/* ==============================
   DEMANDES / CONTRIBUTIONS
============================== */

const STATUS_TO_FRONT = {
  a_verifier: "À vérifier",
  complement: "Complément demandé",
  acceptee: "Acceptée",
  rejetee: "Rejetée",
  publiee: "Publiée",
};

const STATUS_TO_BACK =
  Object.fromEntries(
    Object.entries(
      STATUS_TO_FRONT
    ).map(
      ([key, value]) => [
        value,
        key,
      ]
    )
  );


export async function loadRequests() {
  const response =
    await request(
      "/contributions"
    );

  const items =
    Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : [];

  return items.map((contribution) => {
    let parsed;

    try {
      parsed =
        JSON.parse(
          contribution.contenu
        );
    } catch {
      parsed = {
        entity:
          contribution.contenu,
        note: "",
      };
    }

    return {
      id: contribution._id,

      entity:
        parsed.entity ||
        contribution.certification?.title ||
        "—",

      note:
        parsed.note ||
        contribution.commentaire ||
        "",

      type:
        contribution.type,

      requester:
        contribution.auteur?.name ||
        "—",

      submittedAt:
        day(contribution.createdAt),

      priority:
        "Normale",

      status:
        STATUS_TO_FRONT[
          contribution.statut
        ] ||
        contribution.statut,
    };
  });
}


export const createRequest = ({
  type,
  entity,
  note,
}) =>
  request(
    "/contributions",
    {
      method: "POST",

      body: json({
        type,

        contenu: json({
          entity,
          note,
        }),
      }),
    }
  );


export const setRequestStatus = (
  id,
  status,
  commentaire
) =>
  request(
    `/contributions/${id}/status`,
    {
      method: "PUT",

      body: json({
        statut:
          STATUS_TO_BACK[status],

        commentaire,
      }),
    }
  );


/* ==============================
   AUDIT
============================== */

export async function loadAudit() {
  const response =
    await request("/audit");

  const audits =
    Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : [];

  return audits.map((audit) => ({
    id:
      audit._id ||
      audit.id,

    date:
      audit.createdAt
        ? new Date(
            audit.createdAt
          ).toLocaleString("fr-FR")
        : "",

    user:
      audit.utilisateur?.name ||
      audit.utilisateur?.email ||
      "Utilisateur inconnu",

    action:
      audit.action || "",

    entity:
      audit.entite || "",

    details:
      audit.details || "",
  }));
}


/* ==============================
   UTILISATEURS
============================== */

const ROLE_LABELS = {
  admin:
    "Super administrateur",

  editor:
    "Administrateur éditorial",

  verifier:
    "Vérificateur",

  etablissement:
    "Établissement / institution",
};

const ROLE_TO_BACK =
  Object.fromEntries(
    Object.entries(
      ROLE_LABELS
    ).map(
      ([key, value]) => [
        value,
        key,
      ]
    )
  );


export async function loadUsers() {
  const response =
    await request("/users");

  const items =
    Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : [];

  return items.map((user) => ({
    id: user._id,
    name: user.name,
    email: user.email,

    role:
      ROLE_LABELS[user.role] ||
      user.role,

    status:
      "Actif",
  }));
}


export async function saveUser(form) {
  const role =
    ROLE_TO_BACK[form.role] ||
    "admin";

  return form.id
    ? request(
        `/users/${form.id}`,
        {
          method: "PUT",

          body: json({
            name: form.name,
            email: form.email,
            role,
          }),
        }
      )
    : request(
        "/users",
        {
          method: "POST",

          body: json({
            name: form.name,
            email: form.email,
            password:
              form.password,
            role,
          }),
        }
      );
}


/* ==============================
   NOTIFICATIONS
============================== */

export async function getNotifications() {
  const response =
    await request(
      "/notifications"
    );

  const notifications =
    Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : [];

  return notifications.map(
    (notification) => ({
      id:
        notification._id ||
        notification.id,

      title:
        notification.title ||
        (
          notification.type
            ? notification.type
                .charAt(0)
                .toUpperCase() +
              notification.type.slice(1)
            : "Notification"
        ),

      text:
        notification.message ||
        "",

      read:
        notification.lu === true ||
        notification.read === true,

      date:
        notification.createdAt
          ? new Date(
              notification.createdAt
            ).toLocaleString(
              "fr-FR"
            )
          : "",
    })
  );
}


/*
 * Alias conservé pour éviter de casser
 * d'anciens composants qui utiliseraient
 * loadNotifications().
 */
export const loadNotifications =
  getNotifications;


export async function markNotificationRead(
  id
) {
  return request(
    `/notifications/${id}/read`,
    {
      method: "PUT",
    }
  );
}


/* ==============================
   ANALYTICS
============================== */

/*
 * Récupère les statistiques Analytics.
 *
 * Le backend peut renvoyer :
 *
 * {
 *   searches: 10,
 *   visits: 20,
 *   views: 30,
 *   noResults: 5
 * }
 *
 * ou :
 *
 * {
 *   data: {
 *     searches: 10,
 *     visits: 20,
 *     views: 30,
 *     noResults: 5
 *   }
 * }
 */

/* ==============================
   ANALYTICS
============================== */

export async function loadAnalytics() {
    try {
        const response =
            await request("/analytics");

        console.log(
            "Analytics reçues :",
            response
        );

        return {
            searches: Number(
                response?.searches || 0
            ),

            visits: Number(
                response?.visits || 0
            ),

            views: Number(
                response?.views || 0
            ),

            noResults: Number(
                response?.noResults || 0
            ),
        };
    } catch (error) {
        console.error(
            "Erreur API Analytics :",
            error
        );

        return {
            searches: 0,
            visits: 0,
            views: 0,
            noResults: 0,
        };
    }
}

/*
 * Enregistre une action Analytics.
 *
 * Exemples :
 *
 * trackAnalytics("search")
 * trackAnalytics("view")
 * trackAnalytics("visit")
 * trackAnalytics("noResults")
 */

// export async function trackAnalytics(
//   type,
//   data = {}
// ) {
//   if (!type) {
//     throw new Error(
//       "Le type Analytics est obligatoire"
//     );
//   }

//   return request(
//     "/analytics",
//     {
//       method: "POST",

//       body: json({
//         type,
//         ...data,
//       }),
//     }
//   );
// }


/* ==============================
   TABLEAU DE BORD
============================== */

export async function loadRemoteStore() {
  const [
    certifications,
    organizations,
    establishments,
    documents,
    requests,
    audit,
    notifications,
  ] = await Promise.all([
    loadCertifications()
      .catch(() => []),

    loadReference(
      "organizations"
    ).catch(() => []),

    loadReference(
      "establishments"
    ).catch(() => []),

    loadQuality(
      "documents"
    ).catch(() => []),

    loadRequests()
      .catch(() => []),

    loadAudit()
      .catch(() => []),

    getNotifications()
      .catch(() => []),
  ]);

  return {
    certifications,
    organizations,
    establishments,
    documents,
    requests,
    audit,
    notifications,
  };
}
