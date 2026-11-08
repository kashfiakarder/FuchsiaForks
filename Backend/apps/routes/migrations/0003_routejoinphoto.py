import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("routes", "0002_routeinvite"),
    ]

    operations = [
        migrations.CreateModel(
            name="RouteJoinPhoto",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("image", models.ImageField(upload_to="route_joins/")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "invite",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="photo",
                        to="routes.routeinvite",
                    ),
                ),
            ],
        ),
    ]
