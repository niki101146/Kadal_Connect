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
        # few database round trips (important for a remote database such as Neon): read once, then bulk-insert
        harbors = [Harbor.objects.get_or_create(name=n, defaults={"latitude": la, "longitude": lo})[0]
                   for n, la, lo in HARBORS]
        have = {sp.name: sp for sp in Species.objects.all()}
        new = [Species(name=n, name_ta=ta, category=cat) for n, ta, cat, base in SPECIES if n not in have]
        Species.objects.bulk_create(new)
        have = {sp.name: sp for sp in Species.objects.all()}
        fix = []
        for n, ta, cat, base in SPECIES:
            if not have[n].category:
                have[n].category = cat
                fix.append(have[n])
        if fix:
            Species.objects.bulk_update(fix, ["category"])
        priced = set(PriceUpdate.objects.values_list("harbor_id", "species_id"))
        rows = []
        for n, ta, cat, base in SPECIES:
            for h in harbors:
                # only add a first sample price; never pile up duplicates on re-run
                if (h.id, have[n].id) not in priced:
                    rows.append(PriceUpdate(harbor=h, species=have[n], price_per_kg=round(base * random.uniform(.9, 1.1))))
        PriceUpdate.objects.bulk_create(rows)
        self.stdout.write(f"Seeded {len(SPECIES)} species across {len(harbors)} harbors.")