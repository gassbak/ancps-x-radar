"""Endpoints publics en lecture seule pour les certifications ANCPS scrapées."""
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from radar_jobs.models import ANCPSCertification
from radar_jobs.official_sources import add_official_source


def _certification_record(certification):
    record = certification.data or certification.payload
    if not isinstance(record, dict):
        record = {}
    record = {
        **record,
        'title': record.get('title') or certification.title,
    }
    return add_official_source(record, certification.title)

@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def certifications_list_view(request):
    certifications = ANCPSCertification.objects.all().order_by('title', 'source_id')
    if request.query_params.get("published", "").lower() == "true":
        certifications = certifications.filter(is_published=True)
    records = [_certification_record(certification) for certification in certifications]
    return Response({
        "data": records,
        "pagination": {
            "page": 1,
            "limit": len(records),
            "total": len(records),
            "totalPages": 1,
        },
    })


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def certification_detail_view(request, source_id):
    try:
        certification = ANCPSCertification.objects.get(
            source_id=source_id,
            is_published=True,
        )
    except ANCPSCertification.DoesNotExist:
        return Response({"detail": "Certification introuvable."}, status=404)
    record = _certification_record(certification)
    if not certification.data:
        return Response({"data": record})
    return Response(record)
