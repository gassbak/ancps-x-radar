import { useEffect, useState } from "react";
import { loadAudit } from "../services/adminApi";
import { PageHeader, Table, EmptyState } from "../components/ui";

export default function AuditPage() {
  const [audit, setAudit] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAudit().then(setAudit).catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <PageHeader title="Historique & audit" description="Journalisation des opérations sensibles." />

      {error ? (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : audit.length === 0 ? (
        <EmptyState title="Aucune opération" />
      ) : (
        <Table headers={["Date", "Utilisateur", "Action", "Entité", "Détails"]}>
          {audit.map((a) => (
            <tr key={a.id}>
              <td className="px-5 py-4 text-gray-500">{a.date}</td>
              <td className="px-5 py-4">{a.user}</td>
              <td className="px-5 py-4 font-semibold">{a.action}</td>
              <td className="px-5 py-4">{a.entity}</td>
              <td className="px-5 py-4 text-gray-700">{a.details}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}