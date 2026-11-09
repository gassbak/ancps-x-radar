from django.urls import path
from .views import (
    PaysListCreateView, PaysByIdView,
    RegionListCreateView, RegionByIdView,
    TypeContratListCreateView, TypeContratByIdView,
    EmploiListCreateView, EmploiByIdView,
)

urlpatterns = [
    path("pays/", PaysListCreateView.as_view()),
    path("pays/<int:id>/", PaysByIdView.as_view()),

    path("regions/", RegionListCreateView.as_view()),
    path("regions/<int:id>/", RegionByIdView.as_view()),

    path("contrats/", TypeContratListCreateView.as_view()),
    path("contrats/<int:id>/", TypeContratByIdView.as_view()),

    path("emplois/", EmploiListCreateView.as_view()),
    path("emplois/<int:id>/", EmploiByIdView.as_view()),
]
