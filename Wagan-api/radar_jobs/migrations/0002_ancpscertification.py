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
                ('title', models.CharField(max_length=500)),
                ('source_url', models.URLField(max_length=1000)),
                ('payload', models.JSONField(default=dict)),
                ('last_scraped_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['title', 'source_id'],
            },
        ),
    ]
