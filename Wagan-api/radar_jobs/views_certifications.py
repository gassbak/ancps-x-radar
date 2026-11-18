"""Endpoints publics en lecture seule pour les certifications ANCPS scrapées."""
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from radar_jobs.models import ANCPSCertification


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def certifications_list_view(request):
    certifications = ANCPSCertification.objects.all()
    if request.query_params.get("published", "").lower() == "true":
        certifications = certifications.filter(payload__published=True)
    return Response({"data": [certification.payload for certification in certifications]})


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def certification_detail_view(request, source_id):
    try:
        certification = ANCPSCertification.objects.get(source_id=source_id)
    except ANCPSCertification.DoesNotExist:
        return Response({"detail": "Certification introuvable."}, status=404)
    return Response({"data": certification.payload})
