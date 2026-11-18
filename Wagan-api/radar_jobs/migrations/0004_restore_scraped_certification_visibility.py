from django.db import migrations
from django.utils.dateparse import parse_datetime


def restore_scraped_certifications(apps, schema_editor):
    certification_model = apps.get_model('radar_jobs', 'ANCPSCertification')
    for certification in certification_model.objects.all().iterator():
        payload = certification.payload if isinstance(certification.payload, dict) else {}
        data = certification.data if isinstance(certification.data, dict) else {}
        has_sync_timestamp = parse_datetime(
            str(certification.source_updated_at)
        ) is not None
        if not has_sync_timestamp and (
            payload.get('published') is True or data.get('published') is True
        ):
            certification_model.objects.filter(pk=certification.pk).update(is_published=True)


class Migration(migrations.Migration):

    dependencies = [
        ('radar_jobs', '0003_ancpscertification_schema_compat'),
    ]

    operations = [
        migrations.RunPython(
            restore_scraped_certifications,
            migrations.RunPython.noop,
        ),
    ]
