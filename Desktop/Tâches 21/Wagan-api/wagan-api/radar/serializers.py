from rest_framework import serializers
from .models import PaysRadar, RegionRadar, TypeContratRadar, EmploiRadar

# ------------ Simples ------------
class PaysRadarSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaysRadar
        fields = ["id", "nom"]

class TypeContratRadarSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeContratRadar
        fields = ["id", "nom"]

class RegionRadarSerializer(serializers.ModelSerializer):
    pays_id = serializers.IntegerField(source="pays.id", read_only=True)
    pays_nom = serializers.CharField(source="pays.nom", read_only=True)

    class Meta:
        model = RegionRadar
        fields = ["id", "nom", "pays_id", "pays_nom"]

# ------------ Emploi ------------
class EmploiRadarSerializer(serializers.ModelSerializer):
    # On expose les IDs FK pour écriture :
    region_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    contrat_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    # On expose les noms FK pour lecture :
    region_nom = serializers.CharField(source="emploi_region.nom", read_only=True)
    contrat_nom = serializers.CharField(source="emploi_contrat.nom", read_only=True)
    pays_id = serializers.IntegerField(source="emploi_region.pays.id", read_only=True)
    pays_nom = serializers.CharField(source="emploi_region.pays.nom", read_only=True)

    class Meta:
        model = EmploiRadar
        fields = [
            "id",
            "titre", "logo", "mini_description",
            "date_publication", "date_limite",
            "lien_candidature", "nom_entreprise", "provenance",
            "mail_candidature", "emplacement",
            # FKs (lecture)
            "region_nom", "contrat_nom", "pays_id", "pays_nom",
            # FKs (écriture)
            "region_id", "contrat_id",
        ]

    def create(self, validated_data):
        region_id = validated_data.pop("region_id", None)
        contrat_id = validated_data.pop("contrat_id", None)

        if region_id is not None:
            from .models import RegionRadar
            validated_data["emploi_region"] = RegionRadar.objects.filter(pk=region_id).first()

        if contrat_id is not None:
            from .models import TypeContratRadar
            validated_data["emploi_contrat"] = TypeContratRadar.objects.filter(pk=contrat_id).first()

        # Idempotence soft possible côté vue; ici on crée simplement :
        return EmploiRadar.objects.create(**validated_data)

    def update(self, instance, validated_data):
        region_id = validated_data.pop("region_id", None)
        contrat_id = validated_data.pop("contrat_id", None)

        if region_id is not None:
            from .models import RegionRadar
            instance.emploi_region = RegionRadar.objects.filter(pk=region_id).first()

        if contrat_id is not None:
            from .models import TypeContratRadar
            instance.emploi_contrat = TypeContratRadar.objects.filter(pk=contrat_id).first()

        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance
