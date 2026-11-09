import { useState } from "react";
import { FileText } from "lucide-react";

import { loadStore, saveStore } from "../../services/adminStore";
import {
makeAuditEntry,
withAuditEntry,
} from "../../utils/audit";

import {
PageHeader,
Button,
SearchBar,
Table,
Badge,
Modal,
Input,
Select,
statusTone,
EmptyState,
} from "../ui";

export default function SimpleQualityTable({
title = "Référentiel",
description = "",
storeKey = "",
columns = [],
session = {},
itemType = "élément",
}) {
// --------------------------------------------------
// ÉTAT DU STORE
// --------------------------------------------------

const [store, setStore] = useState(() => {
try {
const savedStore = loadStore();


  if (
    !savedStore ||
    typeof savedStore !== "object" ||
    Array.isArray(savedStore)
  ) {
    return {};
  }

  return savedStore;
} catch (error) {
  console.error(
    "Erreur lors du chargement du store :",
    error
  );

  return {};
}


});

// --------------------------------------------------
// ÉTATS
// --------------------------------------------------

const [query, setQuery] = useState("");
const [modalOpen, setModalOpen] = useState(false);
const [form, setForm] = useState({});

// --------------------------------------------------
// DONNÉES
// --------------------------------------------------

const safeColumns = Array.isArray(columns)
? columns.filter(Boolean)
: [];

const data = Array.isArray(store?.[storeKey])
? store[storeKey].filter(
(item) =>
item &&
typeof item === "object"
)
: [];

const certifications = Array.isArray(
store?.certifications
)
? store.certifications.filter(
(item) =>
item &&
typeof item === "object"
)
: [];

// --------------------------------------------------
// RECHERCHE
// --------------------------------------------------

const searchText = String(query || "")
.trim()
.toLowerCase();

const list = data.filter((item) => {
if (!searchText) {
return true;
}

try {
  return Object.values(item)
    .map((value) => {
      if (
        value === null ||
        value === undefined
      ) {
        return "";
      }

      if (typeof value === "object") {
        try {
          return JSON.stringify(value);
        } catch {
          return "";
        }
      }

      return String(value);
    })
    .join(" ")
    .toLowerCase()
    .includes(searchText);
} catch (error) {
  console.error(
    "Erreur lors de la recherche :",
    error
  );

  return false;
}


});

// --------------------------------------------------
// OUVRIR LE FORMULAIRE
// --------------------------------------------------

const openForm = (item = null) => {
if (
item &&
typeof item === "object"
) {
setForm({
...item,
});
} else {
setForm({});
}

setModalOpen(true);


};

// --------------------------------------------------
// MODIFIER UN CHAMP
// --------------------------------------------------

const updateField = (field, value) => {
if (!field) {
return;
}


setForm((previous) => ({
  ...(previous || {}),
  [field]: value,
}));


};

// --------------------------------------------------
// NOM DE L'ÉLÉMENT
// --------------------------------------------------

const getItemName = (item) => {
if (
!item ||
typeof item !== "object"
) {
return `${itemType} sans nom`;
}


return (
  item?.name ||
  item?.nom ||
  item?.title ||
  item?.titre ||
  `${itemType} sans nom`
);


};

// --------------------------------------------------
// LABEL D'UNE COLONNE
// --------------------------------------------------

const getColumnLabel = (column) => {
if (!column) {
return "";
}


return String(column)
  .replace(/([A-Z])/g, " $1")
  .replace(/^./, (letter) =>
    letter.toUpperCase()
  )
  .trim();


};

// --------------------------------------------------
// AFFICHAGE D'UNE VALEUR
// --------------------------------------------------

const getDisplayValue = (value) => {
if (
value === null ||
value === undefined ||
value === ""
) {
return "—";
}


if (
  typeof value === "object"
) {
  return (
    value?.name ||
    value?.nom ||
    value?.title ||
    value?.titre ||
    (() => {
      try {
        return JSON.stringify(value);
      } catch {
        return "—";
      }
    })()
  );
}

return String(value);


};

// --------------------------------------------------
// CERTIFICATION
// --------------------------------------------------

const getCertificationTitle = (
certificationId
) => {
if (!certificationId) {
return "—";
}


const certification =
  certifications.find(
    (item) =>
      item?.id === certificationId ||
      item?._id === certificationId
  );

if (!certification) {
  return "—";
}

return (
  certification?.title ||
  certification?.titre ||
  certification?.name ||
  certification?.nom ||
  "Certification sans nom"
);


};

// --------------------------------------------------
// ENREGISTRER
// --------------------------------------------------

const save = () => {
try {
const safeForm =
form &&
typeof form === "object"
? form
: {};


  const itemId =
    safeForm?.id ||
    safeForm?._id ||
    `${itemType}_${Date.now()}`;

  const item = {
    ...safeForm,
    id: itemId,
  };

  const isEditing = Boolean(
    safeForm?.id ||
    safeForm?._id
  );

  let updatedData;

  if (isEditing) {
    const currentId =
      safeForm?.id ||
      safeForm?._id;

    updatedData = data.map(
      (existingItem) => {
        if (
          !existingItem ||
          typeof existingItem !== "object"
        ) {
          return existingItem;
        }

        const existingId =
          existingItem?.id ||
          existingItem?._id;

        if (
          existingId === currentId
        ) {
          return {
            ...existingItem,
            ...item,
          };
        }

        return existingItem;
      }
    );
  } else {
    updatedData = [
      item,
      ...data,
    ];
  }

  // ------------------------------------------------
  // UTILISATEUR POUR L'AUDIT
  // ------------------------------------------------

  const userName =
    session?.name ||
    session?.nom ||
    session?.username ||
    session?.email ||
    "Utilisateur";

  // ------------------------------------------------
  // AUDIT
  // ------------------------------------------------

  const currentAudit =
    Array.isArray(store?.audit)
      ? store.audit
      : [];

  const auditEntry =
    makeAuditEntry({
      user: String(userName),
      action: isEditing
        ? "Modification"
        : "Ajout",
      entity: getItemName(item),
      newValue: "Enregistré",
    });

  const next = {
    ...store,
    [storeKey]: updatedData,
    audit: withAuditEntry(
      currentAudit,
      auditEntry
    ),
  };

  // ------------------------------------------------
  // SAUVEGARDE
  // ------------------------------------------------

  const saved = saveStore(next);

  if (!saved) {
    console.error(
      "Impossible de sauvegarder les données."
    );
    return;
  }

  setStore(next);
  setModalOpen(false);
  setForm({});
} catch (error) {
  console.error(
    "Erreur lors de l'enregistrement :",
    error
  );
}


};

// --------------------------------------------------
// FERMER LA MODALE
// --------------------------------------------------

const closeModal = () => {
setModalOpen(false);
setForm({});
};

// --------------------------------------------------
// OPTIONS DES CERTIFICATIONS
// --------------------------------------------------

const certificationOptions = [
{
value: "",
label: "— Aucune —",
},


...certifications
  .filter(
    (certification) =>
      certification?.id ||
      certification?._id
  )
  .map((certification) => ({
    value:
      certification?.id ||
      certification?._id,

    label:
      certification?.title ||
      certification?.titre ||
      certification?.name ||
      certification?.nom ||
      "Certification sans nom",
  })),

];

// --------------------------------------------------
// RENDU
// --------------------------------------------------

return ( <div className="space-y-6">
<PageHeader
title={title}
description={description}
action={
<Button
icon={FileText}
onClick={() => openForm(null)}
>
Ajouter </Button>
}
/>


  <div className="mb-5">
    <SearchBar
      value={query}
      onChange={setQuery}
      placeholder={`Rechercher dans ${String(
        title || ""
      ).toLowerCase()}...`}
    />
  </div>

  {list.length === 0 ? (
    <EmptyState />
  ) : (
    <div className="overflow-x-auto">
      <Table
        headers={[
          ...safeColumns.map(
            getColumnLabel
          ),
          "Certification liée",
          "Actions",
        ]}
      >
        {list.map(
          (item, index) => {
            if (!item) {
              return null;
            }

            const itemId =
              item?.id ||
              item?._id ||
              `${storeKey}_${index}`;

            return (
              <tr
                key={itemId}
                className="border-b last:border-b-0 hover:bg-gray-50"
              >
                {safeColumns.map(
                  (column) => {
                    const value =
                      item?.[column];

                    return (
                      <td
                        key={column}
                        className="px-5 py-4 text-gray-600"
                      >
                        {column ===
                        "status" ? (
                          <Badge
                            tone={statusTone(
                              value || ""
                            )}
                          >
                            {getDisplayValue(
                              value
                            )}
                          </Badge>
                        ) : (
                          getDisplayValue(
                            value
                          )
                        )}
                      </td>
                    );
                  }
                )}

                <td className="px-5 py-4 text-gray-500">
                  {getCertificationTitle(
                    item?.certificationId
                  )}
                </td>

                <td className="px-5 py-4 text-right">
                  <Button
                    variant="ghost"
                    onClick={() =>
                      openForm(item)
                    }
                  >
                    Modifier
                  </Button>
                </td>
              </tr>
            );
          }
        )}
      </Table>
    </div>
  )}

  <Modal
    open={modalOpen}
    onClose={closeModal}
    title={
      form?.id ||
      form?._id
        ? `Modifier ${itemType}`
        : `Ajouter ${itemType}`
    }
  >
    <div className="space-y-4">
      {safeColumns.map(
        (column) => {
          const value =
            form?.[column];

          return (
            <Input
              key={column}
              label={getColumnLabel(
                column
              )}
              value={
                value === null ||
                value === undefined
                  ? ""
                  : String(value)
              }
              onChange={(event) =>
                updateField(
                  column,
                  event.target.value
                )
              }
            />
          );
        }
      )}

      <Select
        label="Certification liée"
        value={
          form?.certificationId ||
          ""
        }
        onChange={(event) =>
          updateField(
            "certificationId",
            event.target.value
          )
        }
        options={
          certificationOptions
        }
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button
          variant="secondary"
          onClick={closeModal}
        >
          Annuler
        </Button>

        <Button onClick={save}>
          Enregistrer
        </Button>
      </div>
    </div>
  </Modal>
</div>


);
}
