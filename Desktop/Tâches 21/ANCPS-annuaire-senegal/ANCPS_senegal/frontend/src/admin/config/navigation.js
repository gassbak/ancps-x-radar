import {
  LayoutDashboard,
  Award,
  Building2,
  School,
  BriefcaseBusiness,
  BrainCircuit,
  Database,
  FileText,
  Upload,
  ClipboardCheck,
  Bell,
  History,
  Users,
  Settings,
} from "lucide-react";

// Menu du back-office, regroupé par section.
// Chaque entrée est filtrée par permission dans AdminSidebar.
export const NAV_GROUPS = [
  {
    title: "Vue d'ensemble",
    items: [
      { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard, permission: "dashboard.read" },
    ],
  },
  {
    title: "Référentiel",
    items: [
      { key: "certifications", label: "Certifications", icon: Award, permission: "content.read" },
      { key: "organizations", label: "Organismes certificateurs", icon: Building2, permission: "content.read" },
      { key: "establishments", label: "Établissements", icon: School, permission: "content.read" },
      { key: "jobs", label: "Métiers", icon: BriefcaseBusiness, permission: "content.read" },
      { key: "skills", label: "Compétences", icon: BrainCircuit, permission: "content.read" },
    ],
  },
  {
    title: "Qualité & données",
    items: [
      { key: "sources", label: "Sources", icon: Database, permission: "sources.read" },
      { key: "documents", label: "Documents", icon: FileText, permission: "documents.read" },
      { key: "requests", label: "Demandes à vérifier", icon: ClipboardCheck, permission: "requests.read" },
      { key: "imports", label: "Import massif", icon: Upload, permission: "imports" },
      { key: "audit", label: "Historique & audit", icon: History, permission: "audit.read" },
    ],
  },
  {
    title: "Administration",
    items: [
      { key: "notifications", label: "Notifications", icon: Bell, permission: "notifications.read" },
      { key: "users", label: "Utilisateurs", icon: Users, permission: "admin.users" },
      { key: "settings", label: "Paramétrage", icon: Settings, permission: "admin.settings" },
    ],
  },
];
