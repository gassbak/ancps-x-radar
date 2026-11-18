from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('radar_jobs', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ANCPSCertification',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source_id', models.CharField(max_length=255, unique=True)),
                ('title', models.CharField(blank=True, db_index=True, default='', max_length=500)),
                ('payload', models.JSONField(default=dict)),
                ('source_url', models.URLField(blank=True, default='', max_length=1000)),
                ('last_scraped_at', models.DateTimeField(auto_now=True, blank=True, null=True)),
                ('data', models.JSONField(default=dict)),
                ('is_published', models.BooleanField(db_index=True, default=True)),
                ('source_updated_at', models.DateTimeField(blank=True, null=True)),
                ('last_synced_at', models.DateTimeField(auto_now=True, blank=True, null=True)),
            ],
            options={
                'verbose_name': 'Certification ANCPS',
                'verbose_name_plural': 'Certifications ANCPS',
                'ordering': ['title', 'source_id'],
            },
        ),
    ]
