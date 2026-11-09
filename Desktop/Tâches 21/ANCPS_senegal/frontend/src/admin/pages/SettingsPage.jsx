import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "../services/settingsApi";





const DEFAULT_SETTINGS = {
  general: {
    platformName: "Plateforme de certification",
    description: "",
    email: "",
    phone: "",
    address: "",
    website: "",
  },
  security: {
    roles: [
      "Administrateur éditorial",
      "Vérificateur",
      "Établissement",
    ],
    accessPolicy: "",
  },
  notifications: {
    newRequest: true,
    validation: true,
    modification: true,
    emailEnabled: true,
    notificationEmail: "",
  },
  maintenance: {
    backupFrequency: "weekly",
    auditLog: true,
    maintenanceNotes: "",
  },
};

const [settings, setSettings] = useState(DEFAULT_SETTINGS);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [error, setError] = useState("");

useEffect(() => {
  let cancelled = false;

  async function loadSettings() {
    try {
      const data = await getSettings();

      if (cancelled) return;

      setSettings({
        general: {
          ...DEFAULT_SETTINGS.general,
          ...data.general,
        },
        security: {
          ...DEFAULT_SETTINGS.security,
          ...data.security,
        },
        notifications: {
          ...DEFAULT_SETTINGS.notifications,
          ...data.notifications,
        },
        maintenance: {
          ...DEFAULT_SETTINGS.maintenance,
          ...data.maintenance,
        },
      });
    } catch (err) {
      if (!cancelled) {
        setError(err.message);
      }
    } finally {
      if (!cancelled) setLoading(false);
    }
  }

  loadSettings();

  return () => {
    cancelled = true;
  };
}, []);



if (loading) {
  return <p>Chargement des paramètres...</p>;
}



{error && (
  <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
    {error}
  </p>
)}


const save = async () => {
  setSaving(true);
  setError("");

  try {
    const payload = {
      ...settings,
      security: {
        ...settings.security,
        roles: Array.isArray(settings.security.roles)
          ? settings.security.roles
          : settings.security.roles
              .split("\n")
              .map((role) => role.trim())
              .filter(Boolean),
      },
    };

    const result = await updateSettings(payload);

    setSettings((previous) => ({
      ...previous,
      ...result.settings,
      security: {
        ...previous.security,
        ...result.settings.security,
        roles: Array.isArray(result.settings.security?.roles)
          ? result.settings.security.roles.join("\n")
          : "",
      },
    }));

    alert("Paramètres enregistrés dans MongoDB.");
  } catch (err) {
    setError(err.message);
  } finally {
    setSaving(false);
  }
};