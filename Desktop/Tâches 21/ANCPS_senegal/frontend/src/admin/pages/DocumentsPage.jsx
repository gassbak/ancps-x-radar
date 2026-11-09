import SimpleQualityTable from "../components/quality/SimpleQualityTable";

export default function DocumentsPage() {
  return (
    <SimpleQualityTable
      title="Documents"
      description="Référentiels, décisions, programmes et pièces justificatives."
      resource="documents"
      columns={["name", "type", "url", "description"]}
      itemType="document"
    />
  );
}