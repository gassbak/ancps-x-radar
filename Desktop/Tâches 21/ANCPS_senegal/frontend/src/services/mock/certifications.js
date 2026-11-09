const certifications = [
  {
    id: "cert_101",
    title: "Développeur Web & Mobile",
    organization: "Bakeli",
    description:
      "Apprenez à concevoir et développer des applications web et mobiles complètes.",
    domain: "Informatique & Numérique",
    level: "Certification Professionnelle",
    mode: "Présentiel",
  },

  {
    id: "cert_102",
    title: "Développeur Backend (Python / Node.js)",
    organization: "ESMT Dakar",
    description:
      "Spécialisation dans la logique serveur, les bases de données et les API.",
    domain: "Informatique & Numérique",
    level: "Licence",
    mode: "Présentiel",
  },

  {
    id: "cert_103",
    title: "Développeur Frontend (React / Vue)",
    organization: "Simplon Sénégal",
    description:
      "Devenez expert en interfaces utilisateurs modernes et réactives.",
    domain: "Informatique & Numérique",
    level: "Certification Professionnelle",
    mode: "Hybride",
  },

  {
    id: "cert_104",
    title: "Technicien Réseaux & Systèmes",
    organization: "IPM Rufisque",
    description:
      "Formation pratique pour l'installation et la maintenance des infrastructures réseaux.",
    domain: "Informatique & Numérique",
    level: "BTS",
    mode: "Présentiel",
  },

  {
    id: "cert_105",
    title: "Administrateur Cloud & DevOps",
    organization: "Orange Digital Center",
    description:
      "Maîtrisez le déploiement continu et l'infrastructure as code.",
    domain: "Informatique & Numérique",
    level: "Certification Professionnelle",
    mode: "En ligne",
  },

  {
    id: "cert_106",
    title: "Data Analyst",
    organization: "UVS",
    description:
      "Analysez les données pour aider à la prise de décision stratégique.",
    domain: "Informatique & Numérique",
    level: "Licence",
    mode: "En ligne",
  },

  {
    id: "cert_107",
    title: "Data Scientist Junior",
    organization: "DIT",
    description:
      "Formation avancée en intelligence artificielle et machine learning.",
    domain: "Informatique & Numérique",
    level: "Master",
    mode: "Présentiel",
  },

  {
    id: "cert_108",
    title: "Technicien en Cybersécurité",
    organization: "ESMT Dakar",
    description:
      "Protégez les systèmes d'information contre les menaces numériques.",
    domain: "Informatique & Numérique",
    level: "BTS",
    mode: "Présentiel",
  },

  {
    id: "cert_109",
    title: "Designer UI/UX",
    organization: "ISI",
    description:
      "Concevez des expériences utilisateurs intuitives et esthétiques.",
    domain: "Informatique & Numérique",
    level: "Certification Professionnelle",
    mode: "Hybride",
  },

  {
    id: "cert_110",
    title: "Community Manager & Social Media Specialist",
    organization: "ISM",
    description:
      "Gérez l'image de marque et l'engagement sur les réseaux sociaux.",
    domain: "Informatique & Numérique",
    level: "Licence",
    mode: "Présentiel",
  },

  {
    id: "cert_111",
    title: "Technicien Maintenance Informatique",
    organization: "CFPT Sénégal-Japon",
    description:
      "Maintenance préventive et curative des parcs informatiques.",
    domain: "Informatique & Numérique",
    level: "CAP",
    mode: "Présentiel",
  },

  {
    id: "cert_112",
    title: "Ingénieur Logiciel (Titre Professionnel)",
    organization: "Sup'Info Sénégal",
    description:
      "Formation d'ingénieurs capables de piloter de grands projets logiciels.",
    domain: "Informatique & Numérique",
    level: "Master",
    mode: "Présentiel",
  },

  {
    id: "cert_113",
    title: "Responsable Marketing Digital",
    organization: "Supdeco Dakar",
    description:
      "Pilotez la stratégie numérique d'une entreprise.",
    domain: "Commerce & Marketing",
    level: "Master",
    mode: "Présentiel",
  },

  {
    id: "cert_114",
    title: "Spécialiste SEO/SEA",
    organization: "ECD",
    description:
      "Expertise en référencement naturel et payant pour la visibilité web.",
    domain: "Commerce & Marketing",
    level: "Certification Professionnelle",
    mode: "En ligne",
  },

  {
    id: "cert_115",
    title: "Chargé de Prospection & Télévente",
    organization: "ADF Formation",
    description:
      "Techniques de vente à distance et négociation commerciale.",
    domain: "Commerce & Marketing",
    level: "Certification Professionnelle",
    mode: "Présentiel",
  },

  {
    id: "cert_116",
    title: "Agent de Relation Client & Support",
    organization: "ESEA Dakar",
    description:
      "Assurez un service client de qualité et fidélisez la clientèle.",
    domain: "Commerce & Marketing",
    level: "BEP",
    mode: "Présentiel",
  },

  {
    id: "cert_117",
    title: "Technico-Commercial B2B",
    organization: "Dakar Business School",
    description:
      "Vente de solutions complexes aux entreprises.",
    domain: "Commerce & Marketing",
    level: "Licence",
    mode: "Hybride",
  },

  {
    id: "cert_118",
    title: "Merchandiser & Animateur Commercial",
    organization: "ISM",
    description:
      "Optimisez la présentation des produits et boostez les ventes en magasin.",
    domain: "Commerce & Marketing",
    level: "BTS",
    mode: "Présentiel",
  },

  {
    id: "cert_119",
    title: "Gestionnaire de Point de Vente",
    organization: "CFPC",
    description:
      "Gérez une boutique ou une unité commerciale de A à Z.",
    domain: "Commerce & Marketing",
    level: "BTS",
    mode: "Présentiel",
  },

  {
    id: "cert_120",
    title: "Assistant Commercial",
    organization: "EPT (Section Pro)",
    description:
      "Support administratif et opérationnel à l'équipe commerciale.",
    domain: "Commerce & Marketing",
    level: "BTS",
    mode: "Présentiel",
  },

  {
    id: "cert_121",
    title: "Assistant Administratif & Bureautique",
    organization: "Office du Bac Formation",
    description:
      "Maîtrise des outils de bureau et du secrétariat classique.",
    domain: "Gestion & Management",
    level: "CAP",
    mode: "Présentiel",
  },

  {
    id: "cert_122",
    title: "Gestionnaire Comptable",
    organization: "CESAG",
    description:
      "Formation de référence en techniques comptables et financières.",
    domain: "Gestion & Management",
    level: "Licence",
    mode: "Présentiel",
  },

  {
    id: "cert_123",
    title: "Assistant Ressources Humaines",
    organization: "IAM",
    description:
      "Support à la gestion du personnel et au recrutement.",
    domain: "Gestion & Management",
    level: "Licence",
    mode: "Présentiel",
  },

  {
    id: "cert_124",
    title: "Analyste Financier Junior",
    organization: "BEM Dakar",
    description:
      "Analyse de la performance financière des entreprises et des marchés.",
    domain: "Gestion & Management",
    level: "Master",
    mode: "Présentiel",
  },

  {
    id: "cert_125",
    title: "Contrôleur de Gestion",
    organization: "Finance Train Academy",
    description:
      "Pilotage de la performance et optimisation des coûts.",
    domain: "Gestion & Management",
    level: "Certification Professionnelle",
    mode: "Hybride",
  },

  {
    id: "cert_126",
    title: "Gestionnaire de Paie & Administration du Personnel",
    organization: "ISF",
    description:
      "Expertise technique sur le traitement des salaires et les déclarations sociales.",
    domain: "Gestion & Management",
    level: "BTS",
    mode: "Présentiel",
  },

  {
    id: "cert_127",
    title: "Secrétaire de Direction",
    organization: "CFPT Sénégal-Japon",
    description:
      "Assistance de haut niveau pour les cadres dirigeants.",
    domain: "Gestion & Management",
    level: "BTS",
    mode: "Présentiel",
  },

  {
    id: "cert_128",
    title: "Aide-Soignant(e)",
    organization: "ENDSS",
    description:
      "Soins d'hygiène et de confort auprès des patients.",
    domain: "Santé & Social",
    level: "CAP",
    mode: "Présentiel",
  },

  {
    id: "cert_129",
    title: "Assistant(e) en Gériatrie",
    organization: "IFSI Dakar",
    description:
      "Accompagnement spécifique des personnes âgées.",
    domain: "Santé & Social",
    level: "Certification Professionnelle",
    mode: "Présentiel",
  },

  {
    id: "cert_130",
    title: "Technicien Laboratoire Biomédical",
    organization: "UCAD Médecine",
    description:
      "Analyses biologiques pour le diagnostic médical.",
    domain: "Santé & Social",
    level: "Licence",
    mode: "Présentiel",
  },

  {
    id: "cert_131",
    title: "Assistant en Nutrition & Diététique",
    organization: "UGB",
    description:
      "Conseil en alimentation et élaboration de régimes adaptés.",
    domain: "Santé & Social",
    level: "Licence",
    mode: "Présentiel",
  },

  {
    id: "cert_132",
    title: "Auxiliaire en Pharmacie",
    organization: "EAM",
    description:
      "Accueil et vente en officine sous la responsabilité du pharmacien.",
    domain: "Santé & Social",
    level: "BEP",
    mode: "Présentiel",
  },

  {
    id: "cert_133",
    title: "Agent d’Accompagnement Social",
    organization: "ENEA Dakar",
    description:
      "Intervention auprès des publics fragiles pour favoriser l'insertion.",
    domain: "Santé & Social",
    level: "BTS",
    mode: "Présentiel",
  },

  {
    id: "cert_134",
    title: "Assistant Hôtelier",
    organization: "ESEA Dakar",
    description:
      "Polyvalence dans les services d'hébergement et de restauration.",
    domain: "Gestion & Management",
    level: "BTS",
    mode: "Présentiel",
  },

  {
    id: "cert_135",
    title: "Réceptionniste & Concierge Professionnel",
    organization: "École Hôtelière de Dakar",
    description:
      "L'image de l'hôtel : accueil, information et services aux clients.",
    domain: "Commerce & Marketing",
    level: "CAP",
    mode: "Présentiel",
  },

  {
    id: "cert_136",
    title: "Technicien en Art Culinaire & Gastronomie",
    organization: "Institut Vatel",
    description:
      "Formation d'excellence aux métiers de la cuisine.",
    domain: "Commerce & Marketing",
    level: "BTS",
    mode: "Présentiel",
  },

  {
    id: "cert_137",
    title: "Gestionnaire d’Établissement Touristique",
    organization: "IST",
    description:
      "Management de structures touristiques (hôtels, camps, agences).",
    domain: "Gestion & Management",
    level: "Licence",
    mode: "Présentiel",
  },

  {
    id: "cert_138",
    title: "Barista & Mixologue Professionnel",
    organization: "CFH Saly",
    description:
      "Expertise dans la préparation de cafés et cocktails.",
    domain: "Commerce & Marketing",
    level: "Certification Professionnelle",
    mode: "Présentiel",
  },

  {
    id: "cert_139",
    title: "Technicien Bâtiment – Gros Œuvre",
    organization: "EPT Thiès",
    description:
      "Conduite et suivi de chantiers de construction.",
    domain: "Industrie & BTP",
    level: "BTS",
    mode: "Présentiel",
  },

  {
    id: "cert_140",
    title: "Technicien en Électricité Industrielle",
    organization: "CFPT Sénégal-Japon",
    description:
      "Installation et maintenance des équipements électriques industriels.",
    domain: "Industrie & BTP",
    level: "BTS",
    mode: "Présentiel",
  },

  {
    id: "cert_141",
    title: "Technicien Maintenance Industrielle",
    organization: "Lycée Delafosse",
    description:
      "Assurer la disponibilité des équipements de production.",
    domain: "Industrie & BTP",
    level: "BTS",
    mode: "Présentiel",
  },

  {
    id: "cert_142",
    title: "Technicien en Froid & Climatisation",
    organization: "CFPT Sénégal-Japon",
    description:
      "Installation et réparation de systèmes frigorifiques et climatisations.",
    domain: "Industrie & BTP",
    level: "CAP",
    mode: "Présentiel",
  },

  {
    id: "cert_143",
    title: "Technicien Solaire & Énergies Renouvelables",
    organization: "CFSK Kaolack",
    description:
      "Installation de panneaux photovoltaïques et systèmes solaires.",
    domain: "Industrie & BTP",
    level: "Certification Professionnelle",
    mode: "Présentiel",
  },

  {
    id: "cert_144",
    title: "Topographe & Géomètre Junior",
    organization: "ENSA Thiès",
    description:
      "Mesures de terrain pour les projets d'aménagement et construction.",
    domain: "Industrie & BTP",
    level: "BTS",
    mode: "Présentiel",
  },

  {
    id: "cert_145",
    title: "Technicien en Sécurité Industrielle & HSE",
    organization: "ISP",
    description:
      "Prévention des risques professionnels et environnementaux.",
    domain: "Industrie & BTP",
    level: "Licence",
    mode: "Présentiel",
  },

  {
    id: "cert_146",
    title: "Technicien Agricole Polyvalent",
    organization: "ENSA Thiès",
    description:
      "Gestion des cultures et production végétale durable.",
    domain: "Agriculture & Environnement",
    level: "BTS",
    mode: "Présentiel",
  },

  {
    id: "cert_147",
    title: "Technicien en Agroalimentaire",
    organization: "ITA",
    description:
      "Transformation et conservation des produits alimentaires.",
    domain: "Agriculture & Environnement",
    level: "BTS",
    mode: "Présentiel",
  },

  {
    id: "cert_148",
    title: "Agent d’Élevage & Zootechnie",
    organization: "ISFAR Bambey",
    description:
      "Soins aux animaux et gestion de la production animale.",
    domain: "Agriculture & Environnement",
    level: "BTS",
    mode: "Présentiel",
  },
];

export default certifications;