from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0002_event_badge_event_end_local_event_gallery_scenes_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="gallerypost",
            name="image",
            field=models.ImageField(blank=True, upload_to="gallery/"),
        ),
    ]
