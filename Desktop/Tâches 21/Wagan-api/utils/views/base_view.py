from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import NotFound

class BaseModelAPIView(generics.RetrieveUpdateDestroyAPIView):
    model = None  # Assurez-vous de spécifier le modèle dans les sous-classes
    queryset = None  # Assurez-vous de spécifier le queryset dans les sous-classes
    serializer_class = None  # Assurez-vous de spécifier le sérialiseur dans les sous-classes

    def get_object_or_404(self, pk):
        try:
            return self.queryset.get(pk=pk)
        except self.model.DoesNotExist:
            raise NotFound("No such item with this id")

    def get_serializer_context(self):
        return {'request': self.request}

class ModelAPIView(generics.ListCreateAPIView):
    #permission_classes = [permissions.IsAuthenticated]

    def post(self, request, format=None):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"status": "success", **serializer.data}, status=status.HTTP_201_CREATED)
        return Response({"status": "failure", "message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, format=None):
        query_params = request.query_params
        if query_params:
            params = {key: value for key, value in query_params.items() if hasattr(self.model, key)}
            queryset = self.queryset.filter(**params)
        else:
            #if not request.user.is_superuser:
                #return Response({"detail": "Acces not autorise."},status=status.HTTP_403_FORBIDDEN)
            queryset = self.queryset.all().order_by('pk')


        serializer = self.serializer_class(queryset, many=True, context=self.get_serializer_context())
        return Response({"status": "success", "count": queryset.count(), "data":serializer.data}, status=status.HTTP_200_OK)

class ModelByIdAPIView(generics.RetrieveUpdateDestroyAPIView):
    #permission_classes = [permissions.IsAuthenticated]

    def get_object_or_404(self, pk):
        try:
            return self.queryset.get(pk=pk)
        except self.model.DoesNotExist:
            raise NotFound("No such item with this id")

    def get_serializer_context(self):
        return {'request': self.request}

    def get(self, request, id, format=None):
        item = self.get_object_or_404(id)
        serializer = self.serializer_class(item, context=self.get_serializer_context())
        print("Je l'ai trouvé")
        return Response({"status": "success", **serializer.data}, status=status.HTTP_200_OK)

    def put(self, request, id, format=None):
        item = self.get_object_or_404(id)
        data = request.data.copy()
        serializer = self.serializer_class(item, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"status": "success",**serializer.data}, status=status.HTTP_200_OK)
        return Response({"status": "failure", "message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id, format=None):
        item = self.get_object_or_404(id)
        item.archived = True
        item.delete()
        return Response({"message": "deleted"}, status=status.HTTP_204_NO_CONTENT)
    


