from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("accounts", "0001_initial")]
    operations = [
        migrations.AddField(model_name="user", name="town", field=models.CharField(blank=True, max_length=60, verbose_name="Town / village")),
        migrations.AddField(model_name="user", name="address", field=models.CharField(blank=True, max_length=255, verbose_name="Full address")),
    ]
