from django.urls import path

from wagan_app.views.chat import ChatAPIView
from wagan_app.views.users import PromoteUserView, RevokeAdminView, TransferSuperAdminView, UserManagementView

urlpatterns = [
    path('wagan/chat/', ChatAPIView.as_view()),
    path('admin/users/', UserManagementView.as_view(), name='admin-users-list'),
    path('admin/users/<int:pk>/promote/', PromoteUserView.as_view(), name='admin-users-promote'),
    path('admin/users/<int:pk>/revoke/', RevokeAdminView.as_view(), name='admin-users-revoke'),
    path('admin/users/<int:pk>/transfer-superadmin/', TransferSuperAdminView.as_view(), name='admin-users-transfer'),
]
