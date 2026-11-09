import { request } from "./api";

export async function trackAnalytics(type, data = {}) {
    if (!type) {
        throw new Error("Le type Analytics est obligatoire");
    }

    try {
        const response = await request("/analytics", {
            method: "POST",
            body: JSON.stringify({
                type,
                ...data,
            }),
        });

        console.log("Analytics enregistré :", {
            type,
            data,
            response,
        });

        return response;
    } catch (error) {
        console.error(
            "Erreur Analytics :",
            type,
            error
        );

        throw error;
    }
}