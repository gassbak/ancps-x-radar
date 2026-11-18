from django.db import migrations
from django.utils.dateparse import parse_datetime


def ensure_compatibility_schema(apps, schema_editor):
    certification_model = apps.get_model('radar_jobs', 'ANCPSCertification')
    table_name = certification_model._meta.db_table
    with schema_editor.connection.cursor() as cursor:
        existing_columns = {
            column.name
            for column in schema_editor.connection.introspection.get_table_description(
                cursor, table_name
            )
        }

    for field in certification_model._meta.local_fields:
        if field.column not in existing_columns:
            schema_editor.add_field(certification_model, field)
            with schema_editor.connection.cursor() as cursor:
                existing_columns = {
                    column.name
                    for column in schema_editor.connection.introspection.get_table_description(
                        cursor, table_name
                    )
                }

    for certification in certification_model.objects.all().iterator():
        payload = certification.payload if isinstance(certification.payload, dict) else {}
        data = certification.data if isinstance(certification.data, dict) else {}
        updates = {}
        if not payload and data:
            updates['payload'] = data
        elif not data and payload:
            updates['data'] = payload
        if not certification.title:
            updates['title'] = payload.get('title') or data.get('title') or ''
        if not certification.source_url:
            source_url = payload.get('sourceUrl') or data.get('sourceUrl')
            if source_url:
                updates['source_url'] = source_url
        has_sync_timestamp = parse_datetime(
            str(certification.source_updated_at)
        ) is not None
        if not has_sync_timestamp and (
            payload.get('published') is True or data.get('published') is True
        ):
            updates['is_published'] = True
        if updates:
            certification_model.objects.filter(pk=certification.pk).update(**updates)


class Migration(migrations.Migration):

    dependencies = [
        ('radar_jobs', '0002_ancpscertification'),
    ]

    operations = [
        migrations.RunPython(
            ensure_compatibility_schema,
            migrations.RunPython.noop,
        ),
    ]
