import { can } from "../services/adminStore";

// Bloque l'accès à une section si le rôle de la session n'a pas la
// permission requise, sans avoir à dupliquer ce contrôle dans
// chaque page.
export default function PermissionGate({ role, permission, children }) {
  if (!can(role, permission)) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
        <h2 className="text-xl font-bold text-red-900">Accès non autorisé</h2>
        <p className="mt-2 text-sm text-red-700">
          Votre rôle ne dispose pas de la permission nécessaire pour cette section.
        </p>
      </div>
    );
  }

  return children;
}
