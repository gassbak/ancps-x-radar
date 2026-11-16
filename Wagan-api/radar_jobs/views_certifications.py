from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from radar_jobs.models import ANCPSCertification
from radar_jobs.official_sources import add_official_source


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def certifications_list_view(request):
    """Renvoie le catalogue ANCPS synchronisé dans Radar."""
    records = list(
        ANCPSCertification.objects.filter(is_published=True)
        .order_by('title', 'source_id')
        .values_list('data', flat=True)
    )
    records = [
        add_official_source(record, record.get('title', ''))
        for record in records
    ]
    return Response({
        'data': records,
        'pagination': {
            'page': 1,
            'limit': len(records),
            'total': len(records),
            'totalPages': 1,
        },
    })


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def certification_detail_view(request, certification_id):
    """Renvoie une fiche ANCPS synchronisée par son identifiant source."""
    certification = ANCPSCertification.objects.filter(
        source_id=certification_id,
        is_published=True,
    ).first()
    if certification is None:
        return Response({'error': 'Certification introuvable.'}, status=404)
    return Response(add_official_source(certification.data, certification.title))
