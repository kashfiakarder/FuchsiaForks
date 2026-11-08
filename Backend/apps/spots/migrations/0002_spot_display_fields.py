from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("spots", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="spot",
            name="address",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="spot",
            name="city",
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name="spot",
            name="region",
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name="spot",
            name="tagline",
            field=models.CharField(blank=True, max_length=150),
        ),
        migrations.AddField(
            model_name="spot",
            name="scene",
            field=models.CharField(
                blank=True,
                choices=[
                    ("creek", "Creek"),
                    ("reservoir", "Reservoir"),
                    ("skyline", "Skyline"),
                    ("meadow", "Meadow"),
                    ("prairie", "Prairie"),
                    ("woods", "Woods"),
                    ("rockies", "Rockies"),
                    ("badlands", "Badlands"),
                ],
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="spot",
            name="features",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
