import { useState } from "react";

function CertificationForm({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    organization: "",
    domain: "",
    status: "Brouillon",
    description: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

const handleSubmit = (event) => {
  event.preventDefault();

  onSubmit(formData);

  onClose();
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">

        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">

          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Ajouter une certification
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Renseignez les informations de la certification.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            ×
          </button>

        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>

          <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">

            {/* Nom */}
            <div className="md:col-span-2">
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Nom de la certification
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex : Développement Web"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>

            {/* Code */}
            <div>
              <label
                htmlFor="code"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Code
              </label>

              <input
                id="code"
                name="code"
                type="text"
                value={formData.code}
                onChange={handleChange}
                placeholder="Ex : CERT-DW-001"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>

            {/* Organisme */}
            <div>
              <label
                htmlFor="organization"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Organisme
              </label>

              <input
                id="organization"
                name="organization"
                type="text"
                value={formData.organization}
                onChange={handleChange}
                placeholder="Ex : Bakeli School"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>

            {/* Domaine */}
            <div>
              <label
                htmlFor="domain"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Domaine
              </label>

              <select
                id="domain"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              >
                <option value="">Sélectionner un domaine</option>
                <option value="Informatique">Informatique</option>
                <option value="Géographie">Géographie</option>
                <option value="Gestion">Gestion</option>
                <option value="Finance">Finance</option>
              </select>
            </div>

            {/* Statut */}
            <div>
              <label
                htmlFor="status"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Statut
              </label>

              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              >
                <option value="Brouillon">Brouillon</option>
                <option value="À vérifier">À vérifier</option>
                <option value="Publié">Publié</option>
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Décrivez la certification..."
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>

          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Enregistrer
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default CertificationForm;