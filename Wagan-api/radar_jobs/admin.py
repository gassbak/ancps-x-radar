from django.contrib import admin

from .models import JobAlert


@admin.register(JobAlert)
class JobAlertAdmin(admin.ModelAdmin):
    list_display = ('email', 'keywords', 'sector', 'location', 'frequency', 'is_active', 'last_sent_at', 'created_at')
    list_filter = ('frequency', 'is_active', 'sector')
    search_fields = ('email', 'keywords')
