from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import ChatSession, ChatMessage, Document
from .serializers import ChatSessionSerializer, ChatMessageSerializer, DocumentSerializer
from .utils import *
import uuid
from rest_framework.parsers import MultiPartParser, FormParser
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.views import APIView

# FAKE Gemini API simulation
def fake_gemini_response(prompt):
    return f"Réponse simulée : {prompt[-300:]}"

class UploadDocumentView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    @swagger_auto_schema(
        operation_description="Uploader un fichier PDF ou Excel",
        manual_parameters=[
            openapi.Parameter(
                name='file',
                in_=openapi.IN_FORM,
                type=openapi.TYPE_FILE,
                required=True,
                description="Fichier PDF ou Excel à indexer"
            ),
        ],
        responses={200: DocumentSerializer},
    )
    def post(self, request, *args, **kwargs):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'Aucun fichier fourni'}, status=400)

        doc = Document.objects.create(file=file)
        path = doc.file.path
        doc.text_content = extract_text(path)
        doc.save()
        return Response(DocumentSerializer(doc).data)



@api_view(['POST'])
def start_chat_session(request):
    session_id = str(uuid.uuid4())
    session = ChatSession.objects.create(session_id=session_id)
    return Response({'session_id': session_id})

@api_view(['POST'])
def chat(request, session_id):
    try:
        session = ChatSession.objects.get(session_id=session_id)
    except ChatSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=404)

    question = request.data.get('message')
    ChatMessage.objects.create(session=session, sender='user', message=question)

    documents = Document.objects.all()
    context = "\n\n".join([doc.text_content[:3000] for doc in documents])

    prompt = f"CONTEXTE:\n{context}\n\nQUESTION:\n{question}"
    response = fake_gemini_response(prompt)

    bot_message = ChatMessage.objects.create(session=session, sender='bot', message=response)
    return Response(ChatMessageSerializer(bot_message).data)

@api_view(['GET'])
def get_session_history(request, session_id):
    try:
        session = ChatSession.objects.get(session_id=session_id)
    except ChatSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=404)

    return Response(ChatSessionSerializer(session).data)
