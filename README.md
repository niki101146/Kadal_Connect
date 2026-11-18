# Kadal Connect – Fisherman's Marketplace + Sea Alerts

Django REST + PostgreSQL backend, React (Vite) frontend.

## Features
- Sea advisory per harbor (waves + wind gusts from Open-Meteo, no API key): Safe / Caution / Stay ashore
- Admin-posted sea alerts (per harbor or all harbors)
- Harbor price comparison table; fishermen report prices
- Fishermen post catch; buyers request quantity; fisherman accepts or declines
- Roles: FISHERMAN and BUYER (JWT login)

## Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                  # set your Postgres password
# in psql:  CREATE DATABASE kadal;
python manage.py makemigrations accounts market alerts
python manage.py migrate
python manage.py seed                                 # harbors (Colachel etc.), fish, sample prices
python manage.py createsuperuser                      # add SeaAlerts at /admin/
python manage.py runserver
```

## Frontend
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 (proxies /api to :8000)
```

## API
| Endpoint | Notes |
|---|---|
| POST /api/auth/register/, /api/auth/token/ | sign up, JWT login |
| GET /api/weather/?harbor=ID | sea advisory (cached 10 min) |
| GET /api/alerts/?harbor=ID | active alerts |
| GET/POST /api/prices/ | POST: fishermen only |
| GET/POST /api/listings/ | POST: fishermen only |
| GET/POST /api/orders/, POST /api/orders/ID/respond/ | `{"accept": true}` |



## What's new (design + weather prediction refresh)
- **White, professional design system**: clean white canvas, navy text, one blue action colour, green/amber/red reserved for sea state and price movement. Inter + Noto Sans Tamil. Fully responsive with mobile tab bar.
- **Weather prediction** (`/sea`): hourly 48 h prediction charts (waves, wind gusts, rain chance, tide) with caution/danger zones and a hover read-out, trend prediction ("getting rougher / calming down"), best fishing windows, 7-day outlook with a fishing score, humidity, pressure, visibility, UV, sunrise/sunset.
- **Trip planner** (`/planner`): choose boat type, day, start time and length; get Go / Caution / Do not go from the hourly prediction, plus a pre-departure checklist.
- **Safety hub** (`/safety`): emergency numbers, safe limits per boat type, what to do when things go wrong.
- **Home dashboard**: live sea card with next-hours strip, price movers with sparklines, quick actions, 7-day strip.
- **Prices**: summary stats (biggest rise/drop, widest harbor gap), card or table view, more sort options, trend sparklines, "your harbor vs average".
- **Marketplace**: stats, max-price filter, "caught today" filter, saved catch (heart), grid/list layout, quick quantity buttons, seller avatar and freshness badge.
- **Orders / Sell / Account / Login**: stats, order progress steps, price hint when posting catch, profile card, split-screen sign-in.
- **Assistant**: now answers live weather questions for the selected harbor.

### API change
`GET /api/weather/?harbor=ID` keeps all existing fields and adds: `hourly` (48 h), `best_windows`, `trend`, `humidity`, `pressure_hpa`, `cloud_pct`, `code`, and per-day `score`, `temp_min`, `uv`, `sunrise`, `sunset`. Forecast days increased from 5 to 7. No new migrations are needed.


## Latest update (orders, address, mobile)
- **Buyer details for sellers**: buyers add town + full address (register, or Account → Contact & address). When requesting fish they can add a delivery address and a message. The seller sees the buyer's name, town and message straight away; the phone number and full address unlock once the seller accepts.
- **All sea fish in the dropdowns**: 70+ species (pelagic, reef/bottom, sharks & rays, prawns/crabs/lobster, squid & shellfish) with Tamil names, grouped by type. Loaded by a migration and by `python manage.py seed` (safe to re-run).
- **Mobile**: hamburger menu replaces the floating bottom bar (also used on tablets), extra bottom space removed, compact footer, aligned action buttons, and tighter responsive layouts on every page.

### To apply
```bash
cd backend
python manage.py migrate      # adds address/town/note fields + loads the full fish list
python manage.py seed         # optional: sample prices for the new fish
```
