from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from wagan_app.serializers import UserSerializer

User = get_user_model()


class UserManagementView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = User.objects.all().order_by('id')
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


class PromoteUserView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        if not request.user.is_superuser:
            return Response({"error": "Seul le Super Admin peut promouvoir un utilisateur."}, status=status.HTTP_403_FORBIDDEN)

        try:
            user = User.objects.get(pk=pk)
            user.is_staff = True
            user.save()
            return Response(
                {"message": f"Utilisateur {user.email} promu Admin avec succès."},
                status=status.HTTP_200_OK,
            )
        except User.DoesNotExist:
            return Response({"error": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

class RevokeAdminView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        if not request.user.is_superuser:
            return Response({"error": "Seul le Super Admin peut révoquer un administrateur."}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(pk=pk)
            if user.is_superuser:
                return Response({"error": "Impossible de révoquer un Super Admin."}, status=status.HTTP_400_BAD_REQUEST)
            user.is_staff = False
            user.save()
            return Response({"message": f"Utilisateur {user.email} révoqué avec succès."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

class TransferSuperAdminView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        if not request.user.is_superuser:
            return Response({"error": "Seul le Super Admin actuel peut transférer son rôle."}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            target_user = User.objects.get(pk=pk)
            if target_user == request.user:
                return Response({"error": "Vous êtes déjà le Super Admin."}, status=status.HTTP_400_BAD_REQUEST)
            
            target_user.is_superuser = True
            target_user.is_staff = True
            target_user.save()
            
            request.user.is_superuser = False
            request.user.save()
            
            return Response({"message": f"Rôle de Super Admin transféré à {target_user.email}."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)
