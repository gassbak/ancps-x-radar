import SimpleQualityTable from "../components/quality/SimpleQualityTable";

export default function SourcesPage() {
  return (
    <SimpleQualityTable
      title="Sources"
      description="Sources vérifiables, références et dates de publication."
      resource="sources"
      columns={["name", "type", "reference", "url", "date"]}
      itemType="source"
    />
  );
}