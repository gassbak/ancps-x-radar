import { SearchBar, Select } from "../ui";

export default function CertificationFilters({ search, onSearchChange, status, onStatusChange, statuses }) {
  return (
    <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
      <SearchBar value={search} onChange={onSearchChange} placeholder="Nom, code, organisme, domaine..." />
      <Select value={status} onChange={(e) => onStatusChange(e.target.value)} options={statuses} />
    </div>
  );
}
