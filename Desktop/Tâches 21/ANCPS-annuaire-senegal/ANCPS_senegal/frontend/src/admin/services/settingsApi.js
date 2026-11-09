const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || `Erreur HTTP ${response.status}`
    );
  }

  return data;
}

export async function getSettings() {
  return request("/api/settings");
}

export async function updateSettings(settings) {
  return request("/api/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}