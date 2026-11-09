import io
import logging
from datetime import datetime, timedelta
from collections import Counter

from django.conf import settings
from django.db import transaction
from django.db.models import Avg, Max, Min, Count
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from radar_jobs.auth import StatelessJWTAuthentication

from .models import UserProfile, CVAnalysis
from .services.cv_analyzer import (
    extract_text_from_file,
    analyze_cv_job_match,
    analyze_cv_job_from_urls,
    analysis_cache
)
from .serializers import (
    CVJobMatchRequestSerializer,
    CVJobMatchUrlRequestSerializer,
    CVJobMatchResponseSerializer,
    HealthCheckResponseSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
    CVAnalysisSerializer,
    CVAnalysisListSerializer,
    UserStatsSerializer,
    AnalyzeWithProfileSerializer,
    AnalyzeScrapedJobSerializer,
    AnalyzeScrapedWithProfileSerializer
)

logger = logging.getLogger(__name__)

ALLOWED_CV_EXT = ('.pdf', '.docx', '.txt', '.md')


def _cv_max_bytes():
    try:
        return int(getattr(settings, 'CV_MAX_UPLOAD_MB', 5)) * 1024 * 1024
    except Exception:
        return 5 * 1024 * 1024


def _validate_upload_file(f, field_name='cv'):
    """Retourne un message d'erreur ou None si le fichier est valide."""
    if not f:
        return f"Le fichier '{field_name}' est requis."
    max_bytes = _cv_max_bytes()
    if hasattr(f, 'size') and f.size and f.size > max_bytes:
        return f"Fichier '{field_name}' trop volumineux (max {max_bytes // (1024 * 1024)} Mo)."
    name = getattr(f, 'name', '') or ''
    if not name.lower().endswith(ALLOWED_CV_EXT):
        return f"Format '{field_name}' non supporté. Autorisés: {', '.join(ALLOWED_CV_EXT)}"
    return None


def _normalize_result_data(result_data):
    """Normalise le résultat LLM avant réponse/sauvegarde (score 0-100, skills liste)."""
    from .services.cv_analyzer import normalize_score
    if not isinstance(result_data, dict):
        return {'score': 0, 'matching_analysis': [], 'description': '', 'recommendation': ''}
    result_data['score'] = normalize_score(result_data.get('score', 0))
    skills = result_data.get('matching_analysis', result_data.get('matching_skills', []))
    if not isinstance(skills, list):
        skills = []
    result_data['matching_analysis'] = [str(s)[:100] for s in skills[:50]]
    for key in ('description', 'recommendation'):
        if not isinstance(result_data.get(key), str):
            result_data[key] = str(result_data.get(key, '') or '')[:2000]
    return result_data


# =============================================
# Endpoints PUBLICS (pas d'auth requise)
# =============================================

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def match_cv_job_view(request):
    """
    Analyse la correspondance entre un CV et une offre d'emploi.
    Endpoint PUBLIC - Pas d'authentification requise.
    """
    serializer = CVJobMatchRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {"error": "Paramètres invalides", "details": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        cv_file = serializer.validated_data['cv']
        job_file = serializer.validated_data['job']
        use_cache = serializer.validated_data.get('use_cache', True)

        err = _validate_upload_file(cv_file, 'cv') or _validate_upload_file(job_file, 'job')
        if err:
            return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)

        cv_text = extract_text_from_file(io.BytesIO(cv_file.read()), cv_file.name)
        job_text = extract_text_from_file(io.BytesIO(job_file.read()), job_file.name)
        
        if not cv_text or not job_text:
            return Response(
                {"error": "L'un des fichiers fournis ne contient aucun texte exploitable."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = analyze_cv_job_match(cv_text, job_text, use_cache=use_cache)
        result['result'] = _normalize_result_data(result.get('result', {}))
        return Response(result, status=status.HTTP_200_OK)

    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Erreur dans match_cv_job_view: {e}")
        return Response({"error": f"Erreur interne: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def match_cv_job_url_view(request):
    """
    Analyse la correspondance entre un CV et une offre via URLs.
    Endpoint PUBLIC - Pas d'authentification requise.
    """
    serializer = CVJobMatchUrlRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {"error": "Paramètres invalides", "details": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        cv_url = serializer.validated_data['cv_url']
        job_url = serializer.validated_data['job_url']
        use_cache = serializer.validated_data.get('use_cache', True)
        
        result = analyze_cv_job_from_urls(cv_url, job_url, use_cache=use_cache)
        return Response(result, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Erreur dans match_cv_job_url_view: {e}")
        return Response({"error": f"Erreur interne: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def cv_scoring_health_view(request):
    """Vérifie l'état du service de CV scoring."""
    import os
    groq_key = os.getenv("GROQ_API_KEY")
    bakeli_key = os.getenv("BAKELI_AI_KEY")
    api_configured = bool(groq_key or bakeli_key)
    
    try:
        model = getattr(settings, 'GROQ_MODEL', None) or os.getenv('GROQ_MODEL', 'qwen/qwen3.8-27b')
    except Exception:
        model = os.getenv('GROQ_MODEL', 'qwen/qwen3.8-27b')
    return Response({
        "status": "healthy",
        "groq_api_configured": api_configured,
        "groq_model": model,
        "cache_size": len(analysis_cache),
        "timestamp": datetime.now().isoformat()
    }, status=status.HTTP_200_OK)


# =============================================
# Endpoints OFFRES SCRAPÉES (nouveau)
# =============================================

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def analyze_scraped_job_view(request):
    """
    Analyse CV vs offre scrapée (public).
    Permet à l'utilisateur de choisir une offre déjà scrapée (via job_id)
    et d'uploader son CV pour obtenir le scoring.

    Body multipart:
      - job_id: str (id du CSV ou offer_url)
      - cv: file (PDF, DOCX, TXT, MD)
      - use_cache: bool (optionnel)
    """
    # Gérer multipart : cv est un fichier, job_id dans form data
    job_id = request.data.get('job_id')
    cv_file = request.FILES.get('cv') or request.data.get('cv')
    use_cache = request.data.get('use_cache', True)
    if isinstance(use_cache, str):
        use_cache = use_cache.lower() not in ('false', '0', 'no')

    if not job_id:
        return Response({"error": "Le champ 'job_id' est requis (id de l'offre scrapée)."}, status=status.HTTP_400_BAD_REQUEST)
    if isinstance(job_id, str) and not job_id.strip():
        return Response({"error": "Le champ 'job_id' ne peut pas être vide."}, status=status.HTTP_400_BAD_REQUEST)
    if not cv_file:
        return Response({"error": "Le fichier CV 'cv' est requis."}, status=status.HTTP_400_BAD_REQUEST)

    # Validation fichier partagée (taille depuis settings + extensions)
    err = _validate_upload_file(cv_file, 'cv')
    if err:
        return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)

    # Récupérer l'offre scrapée
    from .services.scraped_job import get_scraped_job_by_id
    job, job_text = get_scraped_job_by_id(job_id)
    if job is None or not job_text:
        return Response({"error": f"Offre non trouvée pour job_id='{job_id}'. Vérifiez la liste via GET /api/radar_jobs/jobs/."}, status=status.HTTP_404_NOT_FOUND)

    try:
        cv_text = extract_text_from_file(io.BytesIO(cv_file.read()), cv_file.name)
        if not cv_text:
            return Response({"error": "Le CV ne contient aucun texte exploitable."}, status=status.HTTP_400_BAD_REQUEST)

        result = analyze_cv_job_match(cv_text, job_text, use_cache=use_cache)
        result_data = _normalize_result_data(result.get('result', {}))

        return Response({
            "job": {
                "id": job.get('id'),
                "title": job.get('title'),
                "company": job.get('company'),
                "location": job.get('location'),
                "sector": job.get('sector'),
                "type": job.get('type'),
                "offer_url": job.get('offer_url'),
                "source": job.get('source'),
            },
            "source": result.get('source'),
            "result": result_data
        }, status=status.HTTP_200_OK)

    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Erreur analyze_scraped_job_view: {e}")
        return Response({"error": f"Erreur interne: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([StatelessJWTAuthentication])
@permission_classes([IsAuthenticated])
def analyze_scraped_with_profile_view(request):
    """
    Analyse offre scrapée vs CV du profil (authentifié).
    L'utilisateur choisit une offre scrapée (job_id) et son CV stocké est utilisé.

    Body JSON:
      - job_id: str (requis)
      - use_cache: bool (optionnel)
    Enregistre l'analyse dans l'historique (CVAnalysis) et met à jour le profil.
    """
    serializer = AnalyzeScrapedWithProfileSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"error": "Paramètres invalides", "details": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    try:
        profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        return Response({"error": "Profil non trouvé. Uploadez d'abord votre CV via PUT /api/cv-scoring/profile/."}, status=status.HTTP_404_NOT_FOUND)

    if not profile.cv_text:
        return Response({"error": "Aucun CV dans votre profil. Uploadez-le d'abord."}, status=status.HTTP_400_BAD_REQUEST)

    job_id = serializer.validated_data['job_id']
    use_cache = serializer.validated_data.get('use_cache', True)

    from .services.scraped_job import get_scraped_job_by_id
    job, job_text = get_scraped_job_by_id(job_id)
    if job is None or not job_text:
        return Response({"error": f"Offre non trouvée pour job_id='{job_id}'."}, status=status.HTTP_404_NOT_FOUND)

    try:
        result = analyze_cv_job_match(profile.cv_text, job_text, use_cache=use_cache)
        result_data = _normalize_result_data(result.get('result', {}))

        job_title = job.get('title', '')[:255]
        job_company = job.get('company', '')[:255]
        job_url = job.get('offer_url', '')

        with transaction.atomic():
            analysis = CVAnalysis.objects.create(
                user=user,
                job_title=job_title or "Offre scrapée",
                job_company=job_company,
                job_url=job_url,
                job_description=job_text[:1000],
                score=result_data.get('score', 0),
                matching_skills=result_data.get('matching_analysis', []),
                analysis=result_data.get('description', ''),
                recommendation=result_data.get('recommendation', ''),
                source=result.get('source', 'api_call'),
                cv_snapshot=profile.cv_text[:500]
            )
            # Select_for_update pour éviter race condition sur total_analyses
            profile = UserProfile.objects.select_for_update().get(pk=profile.pk)
            profile.current_score = result_data.get('score', 0)
            profile.total_analyses += 1
            profile.save()

        return Response({
            "analysis_id": analysis.id,
            "job": {
                "id": job.get('id'),
                "title": job.get('title'),
                "company": job.get('company'),
                "location": job.get('location'),
                "sector": job.get('sector'),
                "type": job.get('type'),
                "offer_url": job.get('offer_url'),
                "source": job.get('source'),
            },
            "source": result.get('source'),
            "result": result_data,
            "profile_updated": {
                "current_score": profile.current_score,
                "total_analyses": profile.total_analyses
            }
        }, status=status.HTTP_200_OK)

    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Erreur analyze_scraped_with_profile_view: {e}")
        return Response({"error": f"Erreur interne: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================
# Endpoints AUTHENTIFIÉS (auth requise)
# =============================================

@api_view(['GET', 'PUT', 'PATCH'])
@authentication_classes([StatelessJWTAuthentication])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """
    Gérer le profil CV de l'utilisateur connecté.
    - GET: Récupérer le profil
    - PUT/PATCH: Mettre à jour le profil
    """
    user = request.user
    profile, created = UserProfile.objects.get_or_create(user=user)
    
    if request.method == 'GET':
        serializer = UserProfileSerializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    # PUT ou PATCH
    if 'cv_file' in request.data:
        cv_file = request.FILES.get('cv_file')
        if cv_file:
            err = _validate_upload_file(cv_file, 'cv_file')
            if err:
                return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)
            # Extraire le texte du CV
            try:
                cv_text = extract_text_from_file(
                    io.BytesIO(cv_file.read()), 
                    cv_file.name
                )
                profile.cv_file = cv_file
                profile.cv_text = cv_text
            except Exception as e:
                return Response(
                    {"error": f"Erreur lors de l'extraction du CV: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
    
    serializer = UserProfileUpdateSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        # Retourner le profil complet
        profile.refresh_from_db()
        full_serializer = UserProfileSerializer(profile, context={'request': request})
        return Response(full_serializer.data, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@authentication_classes([StatelessJWTAuthentication])
@permission_classes([IsAuthenticated])
def profile_delete_cv_view(request):
    """Supprimer le CV du profil."""
    user = request.user
    try:
        profile = UserProfile.objects.get(user=user)
        if profile.cv_file:
            profile.cv_file.delete()
            profile.cv_text = None
            profile.current_score = 0
            profile.save()
            return Response({"message": "CV supprimé avec succès"}, status=status.HTTP_200_OK)
        return Response({"message": "Aucun CV à supprimer"}, status=status.HTTP_200_OK)
    except UserProfile.DoesNotExist:
        return Response({"message": "Profil non trouvé"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@authentication_classes([StatelessJWTAuthentication])
@permission_classes([IsAuthenticated])
def analyze_with_profile_view(request):
    """
    Analyser le CV du profil contre une offre d'emploi.
    Utilise le CV stocké dans le profil utilisateur.
    Enregistre l'analyse dans l'historique.
    """
    serializer = AnalyzeWithProfileSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {"error": "Paramètres invalides", "details": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = request.user
    
    # Récupérer ou créer le profil
    try:
        profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        return Response(
            {"error": "Profil non trouvé. Veuillez d'abord créer un profil et uploader votre CV."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if not profile.cv_text:
        return Response(
            {"error": "Aucun CV trouvé dans votre profil. Veuillez d'abord uploader votre CV."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        job_url = serializer.validated_data['job_url']
        job_title = serializer.validated_data.get('job_title', '')
        job_company = serializer.validated_data.get('job_company', '')
        use_cache = serializer.validated_data.get('use_cache', True)
        
        # Télécharger et extraire le texte de l'offre
        import requests
        job_response = requests.get(job_url, timeout=30)
        if job_response.status_code != 200:
            return Response(
                {"error": f"Impossible de télécharger l'offre depuis l'URL: {job_url}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        content_type = job_response.headers.get('content-type', '').lower()
        if 'pdf' in content_type or 'word' in content_type or job_url.lower().endswith(('.pdf', '.docx', '.txt', '.md')):
            job_text = extract_text_from_file(io.BytesIO(job_response.content), job_url)
        else:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(job_response.text, 'html.parser')
            for script in soup(["script", "style"]):
                script.decompose()
            job_text = soup.get_text(separator="\n")
            job_text = '\n'.join([line.strip() for line in job_text.splitlines() if line.strip()])
        
        if not job_text:
            return Response(
                {"error": "Impossible d'extraire le contenu de l'offre."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extraire le titre du job depuis l'URL si non fourni
        if not job_title:
            from urllib.parse import urlparse
            parsed = urlparse(job_url)
            job_title = parsed.path.split('/')[-1].replace('-', ' ').replace('_', ' ').title()[:255]
        
        # Analyser la correspondance
        result = analyze_cv_job_match(profile.cv_text, job_text, use_cache=use_cache)
        result_data = _normalize_result_data(result.get('result', {}))

        # Enregistrer dans l'historique + MAJ profil en atomic (anti race condition)
        with transaction.atomic():
            profile = UserProfile.objects.select_for_update().get(pk=profile.pk)
            analysis = CVAnalysis.objects.create(
                user=user,
                job_title=job_title,
                job_company=job_company,
                job_url=job_url,
                job_description=job_text[:1000],  # Limiter la taille
                score=result_data.get('score', 0),
                matching_skills=result_data.get('matching_analysis', []),
                analysis=result_data.get('description', ''),
                recommendation=result_data.get('recommendation', ''),
                source=result.get('source', 'api_call'),
                cv_snapshot=profile.cv_text[:500]  # Snapshot partiel
            )

            # Mettre à jour le profil
            profile.current_score = result_data.get('score', 0)
            profile.total_analyses += 1
            profile.save()
        
        return Response({
            "analysis_id": analysis.id,
            "source": result.get('source'),
            "result": result_data,
            "profile_updated": {
                "current_score": profile.current_score,
                "total_analyses": profile.total_analyses
            }
        }, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Erreur dans analyze_with_profile_view: {e}")
        return Response({"error": f"Erreur interne: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([StatelessJWTAuthentication])
@permission_classes([IsAuthenticated])
def analysis_history_view(request):
    """
    Récupérer l'historique des analyses de l'utilisateur.
    """
    user = request.user
    try:
        limit = int(request.GET.get('limit', 20))
    except (TypeError, ValueError):
        return Response({"error": "Paramètre 'limit' invalide (entier attendu)."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        offset = int(request.GET.get('offset', 0))
    except (TypeError, ValueError):
        return Response({"error": "Paramètre 'offset' invalide (entier attendu)."}, status=status.HTTP_400_BAD_REQUEST)
    limit = max(1, min(100, limit))
    offset = max(0, offset)
    
    analyses = CVAnalysis.objects.filter(user=user)[offset:offset + limit]
    total = CVAnalysis.objects.filter(user=user).count()
    
    serializer = CVAnalysisListSerializer(analyses, many=True)
    
    return Response({
        "total": total,
        "limit": limit,
        "offset": offset,
        "analyses": serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@authentication_classes([StatelessJWTAuthentication])
@permission_classes([IsAuthenticated])
def analysis_detail_view(request, analysis_id):
    """
    Récupérer le détail d'une analyse spécifique.
    """
    user = request.user
    
    try:
        analysis = CVAnalysis.objects.get(id=analysis_id, user=user)
        serializer = CVAnalysisSerializer(analysis)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except CVAnalysis.DoesNotExist:
        return Response(
            {"error": "Analyse non trouvée"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@authentication_classes([StatelessJWTAuthentication])
@permission_classes([IsAuthenticated])
def user_stats_view(request):
    """
    Statistiques personnelles de l'utilisateur.
    """
    user = request.user
    
    # Récupérer le profil
    try:
        profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        profile = None
    
    # Statistiques de base
    analyses = CVAnalysis.objects.filter(user=user)
    total_analyses = analyses.count()
    
    if total_analyses == 0:
        return Response({
            "total_analyses": 0,
            "average_score": 0,
            "best_score": 0,
            "worst_score": 0,
            "skills_frequency": {},
            "recent_analyses": [],
            "improvement_trend": []
        }, status=status.HTTP_200_OK)
    
    # Calculer les stats
    stats = analyses.aggregate(
        average_score=Avg('score'),
        best_score=Max('score'),
        worst_score=Min('score')
    )
    
    # Fréquence des compétences
    all_skills = []
    for analysis in analyses:
        if analysis.matching_skills:
            all_skills.extend(analysis.matching_skills)
    skills_frequency = dict(Counter(all_skills).most_common(20))
    
    # Dernières analyses
    recent = analyses[:5]
    recent_serializer = CVAnalysisListSerializer(recent, many=True)
    
    # Tendance d'amélioration (5 dernières analyses)
    last_5 = list(analyses[:5].values_list('score', flat=True))
    improvement_trend = [
        {"analysis_index": i + 1, "score": score}
        for i, score in enumerate(reversed(last_5))
    ]
    
    return Response({
        "total_analyses": total_analyses,
        "average_score": round(stats['average_score'] or 0, 1),
        "best_score": stats['best_score'] or 0,
        "worst_score": stats['worst_score'] or 0,
        "skills_frequency": skills_frequency,
        "recent_analyses": recent_serializer.data,
        "improvement_trend": improvement_trend,
        "current_score": profile.current_score if profile else 0,
        "target_job": profile.target_job if profile else None
    }, status=status.HTTP_200_OK)
