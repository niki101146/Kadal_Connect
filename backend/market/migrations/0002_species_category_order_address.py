from django.db import migrations, models


def add_species(apps, schema_editor):
    """Load the full sea-fish list so the dropdowns are complete without re-running `seed`."""
    from market.species_data import SPECIES
    Species = apps.get_model("market", "Species")
    for name, ta, cat, _ in SPECIES:
        sp, created = Species.objects.get_or_create(name=name, defaults={"name_ta": ta, "category": cat})
        if not created and not sp.category:
            sp.category = cat
            sp.save(update_fields=["category"])


class Migration(migrations.Migration):
    dependencies = [("market", "0001_initial")]
    operations = [
        migrations.AlterModelOptions(name="species", options={"ordering": ["category", "name"], "verbose_name_plural": "species"}),
        migrations.AddField(model_name="species", name="category", field=models.CharField(blank=True, max_length=40)),
        migrations.AddField(model_name="order", name="delivery_address", field=models.CharField(blank=True, max_length=255)),
        migrations.AddField(model_name="order", name="note", field=models.CharField(blank=True, max_length=200)),
        migrations.RunPython(add_species, migrations.RunPython.noop),
    ]
