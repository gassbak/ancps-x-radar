from django.db import models

# Create your models here.
class PaysRadar(models.Model):
    nom = models.CharField(max_length=50)
    
class RegionRadar(models.Model):
    nom = models.CharField(max_length=150)
    pays = models.ForeignKey(PaysRadar, on_delete=models.CASCADE)

class TypeContratRadar(models.Model):
    nom = models.CharField(max_length=50) 

class EmploiRadar(models.Model):
    titre = models.CharField(max_length=255)
    logo = models.URLField(max_length=500,null=True)
    mini_description = models.TextField(null=True)
    date_publication = models.DateField()
    date_limite = models.DateField(null=True)
    lien_candidature = models.URLField(max_length=500) #lien vers la page détail 
    nom_entreprise = models.CharField(max_length=150)
    provenance = models.CharField(max_length=200)
    mail_candidature = models.EmailField(max_length=150,null=True)
    emplacement = models.CharField(max_length=200,null=True)
    ####
    region = models.ForeignKey(RegionRadar,on_delete=models.CASCADE,name="emploi_region",null=True)
    contrat = models.ForeignKey(TypeContratRadar, on_delete=models.CASCADE, name="emploi_contrat")
   

    