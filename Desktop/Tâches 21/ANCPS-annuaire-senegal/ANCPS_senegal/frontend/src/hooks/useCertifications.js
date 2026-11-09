
import { useEffect, useMemo, useState } from "react";

import { request } from "../services/api";
import { mapCertification } from "../utils/mapCertification";

export default function useCertifications(
    search = "",
    page = 1
) {
    const [certifications, setCertifications] =
        useState([]);

    const [pagination, setPagination] =
        useState({
            page: 1,
            limit: 6,
            total: 0,
            totalPages: 0,
        });

    const [loading, setLoading] =
        useState(true);

    const loadCertifications = async () => {
        setLoading(true);

        try {
            const response = await request(
                `/certifications?published=true&page=${page}&limit=6`
            );

            setCertifications(
                (response.data || []).map(
                    mapCertification
                )
            );

            setPagination(
                response.pagination || {
                    page: 1,
                    limit: 6,
                    total: 0,
                    totalPages: 0,
                }
            );
        } catch (error) {
            console.error(
                "Erreur certifications :",
                error
            );

            setCertifications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCertifications();
    }, [page]);

    const filteredCertifications =
        useMemo(() => {
            if (!search.trim()) {
                return certifications;
            }

            const value =
                search.toLowerCase();

            return certifications.filter(
                (certification) =>
                    [
                        certification.title,
                        certification.organization,
                        certification.sector,
                        certification.type,
                        certification.niveau,
                    ]
                        .join(" ")
                        .toLowerCase()
                        .includes(value)
            );
        }, [certifications, search]);

    return {
        certifications:
            filteredCertifications,

        loading,

        pagination,

        reload:
            loadCertifications,
    };
}
