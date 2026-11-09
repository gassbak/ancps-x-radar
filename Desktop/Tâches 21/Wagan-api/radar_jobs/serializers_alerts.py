from rest_framework import serializers
from .models import JobAlert


class JobAlertCreateSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    keywords = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    sector = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    location = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    job_type = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    frequency = serializers.ChoiceField(choices=['instant', 'daily', 'weekly'], default='daily', required=False)

    def validate(self, attrs):
        if not any([attrs.get('keywords', '').strip(), attrs.get('sector', '').strip(),
                    attrs.get('location', '').strip(), attrs.get('job_type', '').strip()]):
            raise serializers.ValidationError("Au moins un critère est requis (keywords, sector, location ou job_type).")
        return attrs


class JobAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobAlert
        fields = ['id', 'email', 'keywords', 'sector', 'location', 'job_type', 'frequency', 'is_active', 'last_sent_at', 'created_at']
        read_only_fields = ['id', 'is_active', 'last_sent_at', 'created_at']
