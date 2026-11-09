
from django.core.files.storage import default_storage
from rest_framework.response import Response

from rest_framework import views, serializers, status

from chatbot.constantes.functions import extract_text_from_file
from chatbot.serializers import DocumentUploadSerializer
from ..constantes.constante import WAGAN_PERSONA,client


# Classe de vue pour gérer le téléchargement de documents
class DocumentUploadView(views.APIView):
    """
    Vue pour gérer le téléchargement de documents (PDF, Word, TXT) pour enrichir la base de connaissances du chatbot.
    """
    def post(self, request):
        """
        Gère les requêtes POST pour télécharger des documents.  Le texte des documents est extrait
        et ajouté à la base de connaissances du chatbot.

        Args:
            request (Request): L'objet Request contenant le fichier téléchargé.

        Returns:
            Response: L'objet Response indiquant le succès ou l'échec du téléchargement.
        """
        serializer = DocumentUploadSerializer(data=request.data)
        if serializer.is_valid():
            file_obj = serializer.validated_data["file"]
            file_path = default_storage.save(file_obj.name, file_obj)  # Enregistre le fichier

            # Extraire le texte du fichier
            extracted_text = extract_text_from_file(file_path)

            if extracted_text:
                # Ajouter le texte extrait à la base de connaissances (prompt) de Wagan
                global WAGAN_PERSONA
                WAGAN_PERSONA += f"\n\nInformations supplémentaires extraites du document {file_obj.name} : {extracted_text}" # Ajout du contenu du document à la persona
                default_storage.delete(file_path)  # Supprime le fichier après l'extraction
                return Response(
                    {"message": f"Document {file_obj.name} téléchargé et traité avec succès."},
                    status=status.HTTP_200_OK,
                )
            else:
                default_storage.delete(file_path)
                return Response(
                    {"error": f"Impossible de traiter le document {file_obj.name}. Type de fichier non pris en charge ou erreur lors de l'extraction du texte."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

