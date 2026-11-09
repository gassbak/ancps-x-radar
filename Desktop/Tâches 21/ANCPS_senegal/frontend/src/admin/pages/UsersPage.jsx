import { useCallback, useEffect, useState } from "react";
import { UserPlus, Pencil, Trash2 } from "lucide-react";

import { roles } from "../services/adminStore";
import {
  loadUsers,
  saveUser,
  deleteUser
} from "../services/adminApi";

import {
  PageHeader,
  Button,
  Badge,
  Table,
  Modal,
  Input,
  Select
} from "../components/ui";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    role: roles[0] || "visiteur"
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const reload = useCallback(async () => {
    try {
      const data = await loadUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // ===============================
  // OUVRIR LE FORMULAIRE
  // ===============================
  const openForm = (user = null) => {
    if (user) {
      setForm({
        id: user.id || user._id || "",
        name: user.name || "",
        email: user.email || "",
        password: "",
        role: user.role || "visiteur"
      });
    } else {
      setForm({
        id: "",
        name: "",
        email: "",
        password: "",
        role: roles[0] || "visiteur"
      });
    }

    setModalOpen(true);
  };

  // ===============================
  // ENREGISTRER
  // ===============================
  const save = async () => {
    if (!form.name.trim()) {
      alert("Le nom est obligatoire.");
      return;
    }

    if (!form.email.trim()) {
      alert("L'email est obligatoire.");
      return;
    }

    if (!form.id && !form.password) {
      alert("Le mot de passe est obligatoire pour un nouvel utilisateur.");
      return;
    }

    try {
      setSaving(true);

      await saveUser(form);

      alert(
        form.id
          ? "Utilisateur modifié avec succès."
          : "Utilisateur ajouté avec succès."
      );

      setModalOpen(false);

      await reload();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  // ===============================
  // SUPPRIMER
  // ===============================
  const remove = async (user) => {
    const id = user.id || user._id;

    if (!id) {
      alert("ID utilisateur introuvable.");
      return;
    }

    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer ${user.name} ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(id);

      await deleteUser(id);

      alert("Utilisateur supprimé avec succès.");

      await reload();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Utilisateurs & rôles"
        description="Contrôle des accès au back-office par rôle et permission."
        action={
          <Button
            icon={UserPlus}
            onClick={() => openForm()}
          >
            Ajouter un utilisateur
          </Button>
        }
      />

      <Table
        headers={[
          "Utilisateur",
          "Email",
          "Rôle",
          "Statut",
          "Actions"
        ]}
      >
        {users.length === 0 ? (
          <tr>
            <td
              colSpan="5"
              className="px-5 py-8 text-center text-gray-500"
            >
              Aucun utilisateur trouvé.
            </td>
          </tr>
        ) : (
          users.map((user) => {
            const id = user.id || user._id;

            return (
              <tr key={id}>
                <td className="px-5 py-4 font-bold">
                  {user.name || "Sans nom"}
                </td>

                <td className="px-5 py-4">
                  {user.email || "-"}
                </td>

                <td className="px-5 py-4">
                  <Badge tone="blue">
                    {user.role || "visiteur"}
                  </Badge>
                </td>

                <td className="px-5 py-4">
                  <Badge tone="green">
                    {user.status || "Actif"}
                  </Badge>
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      icon={Pencil}
                      onClick={() => openForm(user)}
                    >
                      Modifier
                    </Button>

                    <Button
                      variant="ghost"
                      icon={Trash2}
                      onClick={() => remove(user)}
                      disabled={deleting === id}
                    >
                      {deleting === id
                        ? "Suppression..."
                        : "Supprimer"}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </Table>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          form.id
            ? "Modifier l'utilisateur"
            : "Ajouter un utilisateur"
        }
      >
        <div className="space-y-4">

          <Input
            label="Nom"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value
              })
            }
          />

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value
              })
            }
          />

          <Input
            label="Mot de passe"
            type="password"
            placeholder={
              form.id
                ? "Laisser vide pour conserver l'ancien"
                : "Mot de passe"
            }
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value
              })
            }
          />

          <Select
            label="Rôle"
            value={form.role}
            onChange={(e) =>
              setForm({
                ...form,
                role: e.target.value
              })
            }
            options={roles}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>

            <Button
              onClick={save}
              disabled={saving}
            >
              {saving
                ? "Enregistrement..."
                : "Enregistrer"}
            </Button>
          </div>

        </div>
      </Modal>
    </div>
  );
}