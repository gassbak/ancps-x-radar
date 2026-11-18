from django.contrib import admin

from .models import AnnuaireEvent, Favorite


@admin.register(AnnuaireEvent)
class AnnuaireEventAdmin(admin.ModelAdmin):
    list_display = ('event', 'formation_id', 'detail', 'result_count', 'created_at')
    list_filter = ('event',)
    date_hierarchy = 'created_at'


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('radar_user_id', 'formation_id', 'created_at')
