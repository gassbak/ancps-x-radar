import { useCallback, useEffect, useMemo, useState } from "react";
import {
  EMPTY_CERTIFICATION,
  EMPTY_DECISION,
} from "../components/certifications/certificationDefaults";
import * as adminApi from "../services/adminApi";

const CERTIFICATION_STATUSES = [
  "Tous",
  "Publié",
  "Vérifiée",
  "Déclarée par l'organisme",
  "En cours de vérification",
  "Expirée",
  "Archivée",
];

export function useCertifications() {
  const [certifications, setCertifications] = useState([]);

  const [refs, setRefs] = useState({
    organizations: [],
    establishments: [],
    jobs: [],
    skillsRef: [],
    sources: [],
    domains: adminApi.DEFAULT_DOMAINS,
    levels: adminApi.DEFAULT_LEVELS,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");

  const [formModalOpen, setFormModalOpen] = useState(false);

  const [form, setForm] = useState(EMPTY_CERTIFICATION);

  const [newDecision, setNewDecision] =
    useState(EMPTY_DECISION);

  const [viewedCertification, setViewedCertification] =
    useState(null);

  const reload = useCallback(async () => {
    try {
      console.log("🔵 CHARGEMENT DES CERTIFICATIONS...");

      const [
        certs,
        organizations,
        establishments,
        jobs,
        skillsRef,
        sources,
        domainNames,
        levelNames,
      ] = await Promise.all([
        adminApi.loadCertifications(),

        adminApi.loadReference("organizations"),

        adminApi.loadReference("establishments"),

        adminApi.loadReference("jobs"),

        adminApi.loadReference("skills"),

        adminApi.loadQuality("sources").catch(() => []),

        adminApi.loadNames("/domaines"),

        adminApi.loadNames("/niveaux"),
      ]);

      console.log(
        "🟢 NOMBRE DE CERTIFICATIONS REÇUES :",
        certs.length
      );

      console.log(
        "📋 CERTIFICATIONS :",
        certs
      );

      setCertifications(certs);

      setRefs({
        organizations,
        establishments,
        jobs,
        skillsRef,
        sources,

        domains: [
          ...new Set([
            ...adminApi.DEFAULT_DOMAINS,
            ...domainNames,
          ]),
        ],

        levels: [
          ...new Set([
            ...adminApi.DEFAULT_LEVELS,
            ...levelNames,
          ]),
        ],
      });
    } catch (error) {
      console.error(
        "🔴 ERREUR CHARGEMENT CERTIFICATIONS :",
        error
      );

      alert(error.message);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const list = useMemo(() => {
    return certifications.filter((c) => {
      const matchesStatus =
        statusFilter === "Tous" ||
        c.status === statusFilter ||
        (
          statusFilter === "Publié" &&
          c.published
        );

      const haystack =
        `${c.title} ${c.organizationName} ${c.domain} ${c.code}`
          .toLowerCase();

      return (
        matchesStatus &&
        haystack.includes(search.toLowerCase())
      );
    });
  }, [
    certifications,
    search,
    statusFilter,
  ]);

  const openCreate = () => {
    setForm({
      ...EMPTY_CERTIFICATION,
      id: undefined,
      organizationName: "",
    });

    setNewDecision(EMPTY_DECISION);

    setFormModalOpen(true);
  };

  const openEdit = (certification) => {
    setForm({
      ...EMPTY_CERTIFICATION,
      ...certification,

      objectives: (
        certification.objectives || []
      ).join("\n"),

      skills: (
        certification.skills || []
      ).join("\n"),

      establishmentIds:
        certification.establishmentIds || [],

      jobIds:
        certification.jobIds || [],

      skillIds:
        certification.skillIds || [],

      decisions:
        certification.decisions || [],
    });

    setNewDecision(EMPTY_DECISION);

    setFormModalOpen(true);
  };

  const openDuplicate = (certification) => {
    setForm({
      ...certification,

      id: undefined,

      objectives: (
        certification.objectives || []
      ).join("\n"),

      skills: (
        certification.skills || []
      ).join("\n"),

      title:
        certification.title + " — copie",

      code:
        certification.code
          ? certification.code + "-COPY"
          : "",

      published: false,

      archived: false,

      status:
        "En cours de vérification",

      verificationStatus:
        "En cours de vérification",

      decisions: [],
    });

    setNewDecision(EMPTY_DECISION);

    setFormModalOpen(true);
  };

  const addDecision = () => {
    if (
      !newDecision.authority &&
      !newDecision.decisionRef
    ) {
      alert(
        "Renseignez au moins l'autorité ou la référence de la décision."
      );

      return;
    }

    setForm({
      ...form,

      decisions: [
        {
          ...newDecision,
          id: "dec_" + Date.now(),
        },
        ...form.decisions,
      ],

      status: newDecision.status,
    });

    setNewDecision(EMPTY_DECISION);
  };

  const run = async (action) => {
    try {
      await action();
      await reload();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const save = () =>
    run(async () => {
      if (!form.title?.trim()) {
        throw new Error(
          "L'intitulé est obligatoire."
        );
      }

      await adminApi.saveCertification(form);

      setFormModalOpen(false);
    });

  const remove = (id) => {
    if (
      !confirm(
        "Supprimer cette certification ? Cette action est journalisée."
      )
    ) {
      return;
    }

    run(() =>
      adminApi.removeCertification(id)
    );
  };

  const archive = (certification) =>
    run(() =>
      adminApi.patchCertification(
        certification.id,
        {
          archived: true,
          published: false,
          status: "Archivée",
        }
      )
    );

  const publish = (certification) => {
    const nowPublished =
      !certification.published;

    return run(() =>
      adminApi.patchCertification(
        certification.id,
        {
          published: nowPublished,
          archived: false,

          status: nowPublished
            ? "Vérifiée"
            : "En cours de vérification",
        }
      )
    );
  };

  return {
    domains: refs.domains,
    levels: refs.levels,

    organizations:
      refs.organizations,

    establishments:
      refs.establishments,

    jobs: refs.jobs,

    skillsRef:
      refs.skillsRef,

    sources:
      refs.sources,

    search,
    setSearch,

    statusFilter,
    setStatusFilter,

    statuses:
      CERTIFICATION_STATUSES,

    list,

    form,
    setForm,

    newDecision,
    setNewDecision,

    formModalOpen,
    setFormModalOpen,

    openCreate,
    openEdit,
    openDuplicate,

    addDecision,

    save,

    viewedCertification,
    setViewedCertification,

    remove,
    archive,
    publish,
  };
}