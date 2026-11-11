from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.response import Response

from utils.views.base_view import ModelAPIView, ModelByIdAPIView
from .models import PaysRadar, RegionRadar, TypeContratRadar, EmploiRadar
from .serializers import (
    PaysRadarSerializer, RegionRadarSerializer,
    TypeContratRadarSerializer, EmploiRadarSerializer
)
from .pagination import DefaultPagination# si tu as mis ta base ailleurs, adapte l'import


# ================== Pays ==================
class PaysListCreateView(ModelAPIView):
    #permission_classes = [permissions.IsAuthenticated]
    model = PaysRadar
    queryset = PaysRadar.objects.all().order_by("id")
    serializer_class = PaysRadarSerializer
    pagination_class = DefaultPagination

    def get(self, request, format=None):
        qs = self.queryset
        # filtres simples
        nom = request.query_params.get("nom")
        if nom:
            qs = qs.filter(nom__icontains=nom)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        ser = self.serializer_class(page, many=True, context=self.get_serializer_context())
        return paginator.get_paginated_response(ser.data)


class PaysByIdView(ModelByIdAPIView):
    model = PaysRadar
    queryset = PaysRadar.objects.all()
    serializer_class = PaysRadarSerializer


# ================== Type de Contrat ==================
class TypeContratListCreateView(ModelAPIView):
    #permission_classes = [permissions.IsAuthenticated]
    model = TypeContratRadar
    queryset = TypeContratRadar.objects.all().order_by("id")
    serializer_class = TypeContratRadarSerializer
    pagination_class = DefaultPagination

    def get(self, request, format=None):
        qs = self.queryset
        nom = request.query_params.get("nom")
        if nom:
            qs = qs.filter(nom__icontains=nom)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        ser = self.serializer_class(page, many=True, context=self.get_serializer_context())
        return paginator.get_paginated_response(ser.data)


class TypeContratByIdView(ModelByIdAPIView):
    model = TypeContratRadar
    queryset = TypeContratRadar.objects.all()
    serializer_class = TypeContratRadarSerializer


# ================== Région ==================
class RegionListCreateView(ModelAPIView):
    #permission_classes = [permissions.IsAuthenticated]
    model = RegionRadar
    queryset = RegionRadar.objects.select_related("pays").all().order_by("id")
    serializer_class = RegionRadarSerializer
    pagination_class = DefaultPagination

    def get(self, request, format=None):
        qs = self.queryset
        nom = request.query_params.get("nom")
        pays_id = request.query_params.get("pays_id")
        pays_nom = request.query_params.get("pays_nom")

        if nom:
            qs = qs.filter(nom__icontains=nom)
        if pays_id:
            qs = qs.filter(pays_id=pays_id)
        if pays_nom:
            qs = qs.filter(pays__nom__iexact=pays_nom)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        ser = self.serializer_class(page, many=True, context=self.get_serializer_context())
        return paginator.get_paginated_response(ser.data)


class RegionByIdView(ModelByIdAPIView):
    model = RegionRadar
    queryset = RegionRadar.objects.select_related("pays").all()
    serializer_class = RegionRadarSerializer


# ================== Emploi ==================
class EmploiListCreateView(ModelAPIView):
    """
    Filtres disponibles via query params :
    - search: string (titre OR nom_entreprise)
    - region_id: int
    - region_nom: str (iexact)
    - contrat_id: int
    - contrat_nom: str (iexact)
    - pays_id: int (via region->pays)
    - pays_nom: str (iexact)
    - provenance: str (iexact)
    - date_from: YYYY-MM-DD
    - date_to: YYYY-MM-DD
    - ordering: ex. '-date_publication' (défaut), 'date_publication', 'titre', etc.
    - page, page_size: pagination
    """
    #permission_classes = [permissions.IsAuthenticated]
    model = EmploiRadar
    queryset = EmploiRadar.objects.select_related("emploi_region", "emploi_region__pays", "emploi_contrat").all()
    serializer_class = EmploiRadarSerializer
    pagination_class = DefaultPagination

    def get(self, request, format=None):
        qs = self.queryset

        # --- filtres ---
        search = request.query_params.get("search")
        region_id = request.query_params.get("region_id")
        region_nom = request.query_params.get("region_nom")
        contrat_id = request.query_params.get("contrat_id")
        contrat_nom = request.query_params.get("contrat_nom")
        pays_id = request.query_params.get("pays_id")
        pays_nom = request.query_params.get("pays_nom")
        provenance = request.query_params.get("provenance")
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        ordering = request.query_params.get("ordering") or "-date_publication"

        if search:
            qs = qs.filter(Q(titre__icontains=search) | Q(nom_entreprise__icontains=search))
        if region_id:
            qs = qs.filter(emploi_region_id=region_id)
        if region_nom:
            qs = qs.filter(emploi_region__nom__iexact=region_nom)
        if contrat_id:
            qs = qs.filter(emploi_contrat_id=contrat_id)
        if contrat_nom:
            qs = qs.filter(emploi_contrat__nom__iexact=contrat_nom)
        if pays_id:
            qs = qs.filter(emploi_region__pays_id=pays_id)
        if pays_nom:
            qs = qs.filter(emploi_region__pays__nom__iexact=pays_nom)
        if provenance:
            qs = qs.filter(provenance__iexact=provenance)
        if date_from:
            qs = qs.filter(date_publication__gte=date_from)
        if date_to:
            qs = qs.filter(date_publication__lte=date_to)

        # --- ordering ---
        try:
            qs = qs.order_by(ordering)
        except Exception:
            qs = qs.order_by("-date_publication")

        # --- pagination ---
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        ser = self.serializer_class(page, many=True, context=self.get_serializer_context())
        return paginator.get_paginated_response(ser.data)

    def post(self, request, format=None):
        """
        Création simple (FK via region_id, contrat_id). 
        Idempotence éventuelle à gérer côté client (ou ajouter un check ici si souhaité).
        """
        serializer = self.serializer_class(data=request.data, context=self.get_serializer_context())
        if serializer.is_valid():
            obj = serializer.save()
            return Response({"status": "success", "id": obj.id, **serializer.data}, status=status.HTTP_201_CREATED)
        return Response({"status": "failure", "message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class EmploiByIdView(ModelByIdAPIView):
    # permission_classes = [permissions.IsAuthenticated]
    model = EmploiRadar
    queryset = EmploiRadar.objects.select_related("emploi_region", "emploi_region__pays", "emploi_contrat").all()
    serializer_class = EmploiRadarSerializer
