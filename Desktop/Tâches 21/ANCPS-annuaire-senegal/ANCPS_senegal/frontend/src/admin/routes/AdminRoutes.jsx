import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { getSession, logout } from "../services/adminAuth";
import AdminLayout from "../layouts/AdminLayout";
import PermissionGate from "./PermissionGate";

import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import CertificationsPage from "../pages/CertificationsPage";
import ReferencePages from "../pages/ReferencePages";
import ImportPage from "../pages/ImportPage";
import RequestsPage from "../pages/RequestsPage";
import SourcesPage from "../pages/SourcesPage";
import DocumentsPage from "../pages/DocumentsPage";
import AuditPage from "../pages/AuditPage";
import NotificationsPage from "../pages/NotificationsPage";
import UsersPage from "../pages/UsersPage";
import SettingsPage from "../pages/SettingsPage";

// Point d'entrée unique du back-office ANCPS, monté sur /admin/* par App.jsx.
// Gère la session de démonstration puis délègue l'affichage à AdminLayout.
export default function AdminRoutes() {
  const [session, setSession] = useState(() => getSession());

  const handleLogout = () => {
    logout();
    setSession(null);
  };

  if (!session) {
    return <LoginPage onLogin={setSession} />;
  }

  const role = session.role;

  return (
    <Routes>
      <Route element={<AdminLayout session={session} onLogout={handleLogout} />}>
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<DashboardPage />} />

        {/* Référentiel */}
        <Route
          path="certifications"
          element={
            <PermissionGate role={role} permission="content.read">
              <CertificationsPage session={session} />
            </PermissionGate>
          }
        />
        <Route
          path="organizations"
          element={
            <PermissionGate role={role} permission="content.read">
              <ReferencePages type="organizations" session={session} />
            </PermissionGate>
          }
        />
        <Route
          path="establishments"
          element={
            <PermissionGate role={role} permission="content.read">
              <ReferencePages type="establishments" session={session} />
            </PermissionGate>
          }
        />
        <Route
          path="jobs"
          element={
            <PermissionGate role={role} permission="content.read">
              <ReferencePages type="jobs" session={session} />
            </PermissionGate>
          }
        />
        <Route
          path="skills"
          element={
            <PermissionGate role={role} permission="content.read">
              <ReferencePages type="skills" session={session} />
            </PermissionGate>
          }
        />

        {/* Qualité & données */}
        <Route
          path="sources"
          element={
            <PermissionGate role={role} permission="content.read">
              <SourcesPage session={session} />
            </PermissionGate>
          }
        />
        <Route
          path="documents"
          element={
            <PermissionGate role={role} permission="content.read">
              <DocumentsPage session={session} />
            </PermissionGate>
          }
        />
        <Route
          path="requests"
          element={
            <PermissionGate role={role} permission="requests.read">
              <RequestsPage session={session} />
            </PermissionGate>
          }
        />
        <Route
          path="imports"
          element={
            <PermissionGate role={role} permission="imports">
              <ImportPage session={session} />
            </PermissionGate>
          }
        />
        <Route
          path="audit"
          element={
            <PermissionGate role={role} permission="audit.read">
              <AuditPage />
            </PermissionGate>
          }
        />

        {/* Administration */}
        <Route path="notifications" element={<NotificationsPage />} />
        <Route
          path="users"
          element={
            <PermissionGate role={role} permission="admin.users">
              <UsersPage session={session} />
            </PermissionGate>
          }
        />
        <Route
          path="settings"
          element={
            <PermissionGate role={role} permission="admin.settings">
              <SettingsPage />
            </PermissionGate>
          }
        />

        {/* URL inconnue */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
