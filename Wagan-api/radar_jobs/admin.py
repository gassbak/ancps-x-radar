from django.contrib import admin

from .models import ANCPSCertification, JobAlert


@admin.register(JobAlert)
class JobAlertAdmin(admin.ModelAdmin):
    list_display = ('email', 'keywords', 'sector', 'location', 'frequency', 'is_active', 'last_sent_at', 'created_at')
    list_filter = ('frequency', 'is_active', 'sector')
    search_fields = ('email', 'keywords')


@admin.register(ANCPSCertification)
class ANCPSCertificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'source_id', 'is_published', 'source_updated_at', 'last_synced_at')
    list_filter = ('is_published',)
    search_fields = ('title', 'source_id')
    readonly_fields = ('last_synced_at',)
