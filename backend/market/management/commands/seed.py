import random
from django.core.management.base import BaseCommand
from accounts.models import Harbor
from market.models import PriceUpdate, Species
from market.species_data import SPECIES

HARBORS = [("Colachel", 8.1790, 77.2530), ("Muttom", 8.1306, 77.3118), ("Kanyakumari", 8.0883, 77.5385),
           ("Thengapattinam", 8.2278, 77.1673), ("Vizhinjam", 8.3792, 76.9889)]


class Command(BaseCommand):
    help = "Seed harbors, all sea-fish species and sample prices (safe to run more than once)"

    def handle(self, *a, **kw):
        harbors = [Harbor.objects.get_or_create(name=n, defaults={"latitude": la, "longitude": lo})[0]
                   for n, la, lo in HARBORS]
        for n, ta, cat, base in SPECIES:
            sp, _ = Species.objects.get_or_create(name=n, defaults={"name_ta": ta, "category": cat})
            if not sp.category:
                sp.category = cat
                sp.save(update_fields=["category"])
            for h in harbors:
                # only add a first sample price; never pile up duplicates on re-run
                if not PriceUpdate.objects.filter(harbor=h, species=sp).exists():
                    PriceUpdate.objects.create(harbor=h, species=sp, price_per_kg=round(base * random.uniform(.9, 1.1)))
        self.stdout.write(f"Seeded {len(SPECIES)} species across {len(harbors)} harbors.")
