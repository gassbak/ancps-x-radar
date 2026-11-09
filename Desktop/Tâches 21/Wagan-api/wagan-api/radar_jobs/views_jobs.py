"""Vues offres d'emploi : liste, détail, statut, téléchargement CSV."""
import ast
import logging
import math
import os
import urllib.parse

import pandas as pd
from django.conf import settings
from django.http import JsonResponse, FileResponse
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from radar_jobs.services.jobs_store import load_jobs_df as load_jobs_df_cached
from radar_jobs.views_helpers import ensure_type_column

logger = logging.getLogger(__name__)

MAX_JOB_ID_LENGTH = 2048

GENERIC_COMPANIES = {
    'entreprise dkr', 'société de la place', 'societe de la place', 'entreprise',
    'société', 'societe', 'cabinet', 'structure', 'non spécifié', 'non spécifiée',
    'n/a', 'nan', 'none', 'au sénégal', 'sénégal', 'dakar', 'sénégal (multi-régions)', ''
}


def normalize_company(val):
    comp_raw = str(val or '').strip()
    if not comp_raw:
        return "Non spécifié"
    comp_clean = comp_raw.title() if comp_raw.islower() or comp_raw.isupper() else comp_raw
    if comp_clean.lower() in GENERIC_COMPANIES:
        return "Non spécifié"
    return comp_clean


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def status_view(request):
    """Vérifie le statut du pipeline et renvoie les métadonnées globales."""
    if os.path.exists(settings.PROCESSED_FILE):
        try:
            stats = os.stat(settings.PROCESSED_FILE)
            df = load_jobs_df_cached()
            if df is None:
                raise ValueError("CSV illisible")
            df = ensure_type_column(df)
            total_jobs = len(df)
            last_update = pd.to_datetime(stats.st_mtime, unit='s').isoformat()
            sectors = df['sector'].dropna().unique().tolist() if 'sector' in df.columns else []
            types_dist = df['type'].value_counts().to_dict() if 'type' in df.columns else {}
            location_dist = df['location'].value_counts().to_dict() if 'location' in df.columns else {}

            # ---- KPIs enrichis (additifs, compatibles avec l'ancien front) ----
            def _clean_label(v):
                s = str(v or '').strip()
                return '' if s.lower() in ('', 'nan', 'none', 'non spécifié', 'non spécifiée', 'n/a') else s

            # Top compétences (key_skills "a, b, c")
            top_skills = {}
            if 'key_skills' in df.columns:
                for val in df['key_skills'].dropna().astype(str):
                    for skill in [s.strip().lstrip('#') for s in val.split(',')]:
                        skill = _clean_label(skill)
                        if skill:
                            top_skills[skill] = top_skills.get(skill, 0) + 1
                top_skills = dict(sorted(top_skills.items(), key=lambda kv: kv[1], reverse=True)[:10])

            # Contrats
            contracts_dist = {}
            if 'contract_type' in df.columns:
                for k, v in df['contract_type'].value_counts().items():
                    label = _clean_label(k) or 'Non renseigné'
                    contracts_dist[label] = contracts_dist.get(label, 0) + int(v)

            # Top entreprises (hors placeholders et faux positifs géographiques)
            COMPANY_STOPLIST = {'au sénégal', 'sénégal', 'dakar', 'sénégal (multi-régions)'}
            top_companies = {}
            if 'company' in df.columns:
                for k, v in df['company'].value_counts().items():
                    label = _clean_label(k)
                    if label and label.lower() not in COMPANY_STOPLIST:
                        top_companies[label] = int(v)
                    if len(top_companies) >= 8:
                        break

            # Part des offres exigeant de l'expérience (min_exp > 0)
            avg_exp = None
            share_with_exp = 0
            if 'min_exp' in df.columns:
                valid_exp = pd.to_numeric(df['min_exp'], errors='coerce').dropna()
                if not valid_exp.empty:
                    avg_exp = round(float(valid_exp.mean()), 1)
                    share_with_exp = round(100 * (valid_exp > 0).mean(), 1)

            # Part des descriptions détaillées (vs fallback générique) + sources actives
            share_real_desc = 0
            if 'description' in df.columns and total_jobs:
                is_fallback = df['description'].fillna('').astype(str).str.startswith('Opportunité professionnelle')
                share_real_desc = round(100 * (~is_fallback).mean(), 1)
            sources_count = int(df['source'].nunique()) if 'source' in df.columns else 0

            # Secteurs triés + part du top secteur
            sectors_dist = df['sector'].value_counts().to_dict() if 'sector' in df.columns else {}
            top_sector_share = round(100 * max(sectors_dist.values()) / total_jobs, 1) if sectors_dist and total_jobs else 0

            # Nouvelles offres du dernier run (last_run.json du pipeline)
            new_jobs = None
            try:
                import json as _json
                with open(os.path.join(settings.DATA_DIR, 'last_run.json'), 'r', encoding='utf-8') as f:
                    new_jobs = _json.load(f).get('new_jobs')
            except Exception:
                pass

            return Response({
                "status": "success",
                "ready": True,
                "last_update": last_update,
                "total_jobs": total_jobs,
                "processed_file_exists": True,
                "sectors": sectors,
                "types_distribution": types_dist,
                "locations_distribution": location_dist,
                "size_kb": stats.st_size / 1024,
                "top_skills": top_skills,
                "contracts_distribution": contracts_dist,
                "top_companies": top_companies,
                "sectors_distribution": sectors_dist,
                "avg_experience": avg_exp,
                "share_with_experience": share_with_exp,
                "share_real_descriptions": share_real_desc,
                "sources_count": sources_count,
                "top_sector_share": top_sector_share,
                "new_jobs": new_jobs,
            })
        except Exception as e:
            logger.error(f"Erreur status_view: {e}")
    return Response({
        "status": "error",
        "ready": False,
        "total_jobs": 0,
        "processed_file_exists": False,
        "sectors": [],
        "types_distribution": {},
        "locations_distribution": {},
        "message": "Aucune donnée traitée disponible."
    })


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def download_csv_view(request):
    """Permet de récupérer le dernier CSV."""
    if os.path.exists(settings.PROCESSED_FILE):
        return FileResponse(
            open(settings.PROCESSED_FILE, 'rb'),
            as_attachment=True,
            filename="jobs_senegal_processed.csv",
            content_type="text/csv"
        )
    return JsonResponse({"message": "Fichier CSV non trouvé. Lancez un scraping d'abord."}, status=404)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def jobs_list_view(request):
    """Renvoie la liste des offres d'emploi avec filtrage et pagination."""
    if os.path.exists(settings.PROCESSED_FILE):
        try:
            df = load_jobs_df_cached()
            if df is None:
                raise ValueError("CSV illisible")
            df = ensure_type_column(df)

            # Filtrage par secteur
            sector = request.GET.get('sector')
            if sector and 'sector' in df.columns:
                df = df[df['sector'].str.lower() == sector.lower()]

            # Filtrage par type d'offre (Emploi, Stage, Bourse, etc.)
            job_type = request.GET.get('type') or request.GET.get('contract_type')
            if job_type and job_type.lower() not in ['tout voir', 'tous', 'all', '']:
                if 'type' in df.columns:
                    df = df[df['type'].str.lower() == job_type.lower()]

            # Filtrage par localisation
            location = request.GET.get('location')
            if location and location.lower() not in ['toute les régions', 'toutes les régions', '']:
                if 'location' in df.columns:
                    df = df[df['location'].str.lower() == location.lower()]

            # Filtrage par entreprise (partenaire)
            company = request.GET.get('company')
            if company and 'company' in df.columns:
                target_comp = company.strip().lower()
                df = df[df['company'].apply(lambda x: normalize_company(x).lower() == target_comp)]

            # Recherche textuelle libre
            search = request.GET.get('search')
            if search:
                search_lower = search.lower()
                mask = pd.Series(False, index=df.index)
                for col in ['title', 'company', 'key_skills', 'location', 'description', 'sector']:
                    if col in df.columns:
                        mask |= df[col].astype(str).str.lower().str.contains(search_lower, na=False)
                df = df[mask]

            total = len(df)

            # Pagination
            try:
                page = int(request.GET.get('page', 1))
            except ValueError:
                page = 1
            try:
                limit = int(request.GET.get('limit', 10))
            except ValueError:
                limit = 10

            pages = max(1, math.ceil(total / limit)) if limit > 0 else 1
            page = max(1, min(page, pages))

            start_idx = (page - 1) * limit
            end_idx = start_idx + limit

            df_page = df.iloc[start_idx:end_idx].copy()

            # Enrichissement Front
            if 'coordinates' in df_page.columns:
                df_page['coordinates'] = df_page['coordinates'].apply(lambda x: ast.literal_eval(x) if isinstance(x, str) and x.startswith('[') else x)
            if 'key_skills' in df_page.columns:
                def format_skills(val):
                    if not isinstance(val, str) or not val.strip():
                        return []
                    skills = [s.strip() for s in val.split(',')]
                    return [s if s.startswith('#') else f"#{s}" for s in skills]
                df_page['key_skills'] = df_page['key_skills'].apply(format_skills)

            if 'id' not in df_page.columns:
                df_page['id'] = df_page.index.astype(str)

            jobs = df_page.to_dict(orient='records')

            return Response({
                "total": total,
                "page": page,
                "limit": limit,
                "pages": pages,
                "jobs": jobs
            })
        except Exception as e:
            logger.error(f"Erreur lors de la lecture du CSV: {e}")
            return JsonResponse({"error": f"Erreur lors de la lecture des données: {str(e)}"}, status=500)
    return JsonResponse({"message": "Aucune donnée disponible. Lancez un scraping d'abord."}, status=404)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def job_detail_view(request, job_id):
    """Renvoie le détail d'une offre par son ID (index) ou offer_url."""
    if not os.path.exists(settings.PROCESSED_FILE):
        return JsonResponse({"error": "Aucune donnée disponible. Lancez un scraping d'abord."}, status=404)
    try:
        df = load_jobs_df_cached()
        if df is None:
            return JsonResponse({"error": "CSV illisible"}, status=500)
        df = ensure_type_column(df)

        job_id_str = urllib.parse.unquote(str(job_id)).strip()
        if not job_id_str:
            return JsonResponse({"error": "job_id vide"}, status=400)
        if len(job_id_str) > MAX_JOB_ID_LENGTH:
            return JsonResponse({"error": "job_id trop long"}, status=400)
        row = df[df['id'] == job_id_str]
        # fallback offer_url
        if row.empty and 'offer_url' in df.columns:
            row = df[df['offer_url'].astype(str) == job_id_str]
        # fallback index numérique
        if row.empty:
            try:
                idx = int(job_id_str)
                if 0 <= idx < len(df):
                    row = df.iloc[[idx]]
            except (ValueError, IndexError):
                pass

        if row.empty:
            return JsonResponse({"error": f"Offre non trouvée: {job_id_str[:120]}"}, status=404)

        record = row.iloc[0].to_dict()
        # Enrichissement Front identique à jobs_list_view
        if isinstance(record.get('coordinates'), str) and record['coordinates'].startswith('['):
            try:
                record['coordinates'] = ast.literal_eval(record['coordinates'])
            except Exception:
                pass
        ks = record.get('key_skills')
        # NaN -> []
        try:
            if ks is None or (isinstance(ks, float) and (math.isnan(ks) or np.isnan(ks))):
                record['key_skills'] = []
            elif pd.isna(ks):
                record['key_skills'] = []
            elif isinstance(ks, str):
                if not ks.strip():
                    record['key_skills'] = []
                else:
                    skills = [s.strip() for s in ks.split(',')]
                    record['key_skills'] = [s if s.startswith('#') else f"#{s}" for s in skills]
        except Exception:
            if isinstance(ks, str):
                if not ks.strip():
                    record['key_skills'] = []
                else:
                    skills = [s.strip() for s in ks.split(',')]
                    record['key_skills'] = [s if s.startswith('#') else f"#{s}" for s in skills]
            elif ks is None:
                record['key_skills'] = []

        # Sanitize NaN -> None pour JSON (évite pd.isna sur list/array)
        for k, v in list(record.items()):
            if isinstance(v, (list, dict)):
                continue
            try:
                if pd.isna(v):
                    record[k] = None
                    continue
            except Exception:
                pass
            if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                record[k] = None

        return Response(record)
    except Exception as e:
        logger.error(f"Erreur job_detail_view: {e}")
        return JsonResponse({"error": f"Erreur lors de la lecture: {str(e)}"}, status=500)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def partners_view(request):
    """Renvoie la liste agrégée des partenaires (entreprises) à partir des offres scrapées."""
    if not os.path.exists(settings.PROCESSED_FILE):
        return Response({"success": True, "partners": []})
    try:
        df = load_jobs_df_cached()
        if df is None or 'company' not in df.columns:
            return Response({"success": True, "partners": []})

        sector_icon_map = {
            'informatique': 'Code',
            'telecom': 'Radio',
            'télécom': 'Radio',
            'banque': 'Landmark',
            'finance': 'CreditCard',
            'education': 'GraduationCap',
            'éducation': 'GraduationCap',
        }

        partners_data = {}
        for _, row in df.iterrows():
            comp_key = normalize_company(row.get('company', ''))

            sector = str(row.get('sector', 'Entreprise')).strip()
            sector_clean = sector if sector and sector.lower() not in ('nan', 'none', '') else 'Entreprise Partenaire'

            offer_url = str(row.get('offer_url', row.get('url', ''))).strip()

            if comp_key not in partners_data:
                partners_data[comp_key] = {
                    "id": comp_key.lower().replace(' ', '-'),
                    "name": comp_key,
                    "category": sector_clean if comp_key != "Non spécifié" else "Divers / Non spécifié",
                    "activeOffers": 0,
                    "logo": None,
                    "icon": sector_icon_map.get(sector_clean.lower(), 'Building2') if comp_key != "Non spécifié" else 'Building2',
                    "url": offer_url if comp_key != "Non spécifié" and offer_url and not offer_url.startswith('nan') else "#"
                }
            partners_data[comp_key]["activeOffers"] += 1

        sorted_partners = sorted(
            partners_data.values(),
            key=lambda x: (1 if x["name"] == "Non spécifié" else 0, -x["activeOffers"], x["name"])
        )

        return Response({
            "success": True,
            "count": len(sorted_partners),
            "partners": sorted_partners
        })
    except Exception as e:
        logger.error(f"Erreur partners_view: {e}")
        return Response({"success": True, "partners": []})
