# Flight Ticket Tracker

A local flight price tracker with:

- User register/login
- MongoDB storage for users and saved alerts
- Real flight offer checks through the Ignav flight prices API
- Browser pop-up/modal when a saved ticket route hits the target price

## Setup

1. Install MongoDB Community Server if it is not already running.
2. Open MongoDB Compass and connect to:

   ```text
   mongodb://127.0.0.1:27017
   ```

3. Create a free Ignav account:

   ```text
   https://ignav.com/
   ```

4. Create a `.env` file in this folder by copying `.env.example`.
5. Put your Ignav API key in `.env`.
6. Install dependencies:

   ```bash
   npm.cmd install
   ```

   If PowerShell blocks `npm`, keep using `npm.cmd`.

7. Start the website:

   ```bash
   npm.cmd run dev
   ```

8. Open:

   ```text
   http://localhost:3000
   ```

## Python helper

You can run a quick local setup check with Python:

```bash
python scripts/check_setup.py
```

It checks that `.env` exists, the Ignav key is set, and MongoDB is reachable.

To create a high target-price alert for testing the pop-up:

```bash
python scripts/create_fake_target_alert.py
```

Then log in with the email and password printed by the script and click `Check saved alerts now`.

To test the main local APIs:

```bash
python -B scripts/test_project.py
```

If you only want to test login/MongoDB/alerts without calling the live flight API:

```bash
python -B scripts/test_project.py --skip-flight-api
```

More Python helper scripts:

```bash
python -B scripts/health_report.py
python -B scripts/seed_demo_alerts.py
python -B scripts/list_alerts.py --email demo@example.com --password password123
python -B scripts/check_alerts_once.py --email demo@example.com --password password123
python -B scripts/export_alerts_csv.py --email demo@example.com --password password123
python -B scripts/delete_alerts.py --email demo@example.com --password password123 --all
python -B scripts/generate_project_excel.py
```

To create an Excel report of tracked flights for an account:

```bash
python -B scripts/generate_project_excel.py --email demo@example.com --password password123 --check-today
```

The `Tracked Flights` sheet shows route, target price, last price, last checked date, and whether the target was hit.

To create the tracked-flights report for all users:

```bash
python -B scripts/generate_project_excel.py --all-users --check-today
```

This uses `ADMIN_REPORT_KEY` from `.env`, so you do not need every user's login.

## Notes

- The app uses Ignav by default: `https://ignav.com/api`.
- The page checks saved alerts every 60 seconds while it is open.
- Click `Allow pop-ups` in the app to enable desktop notifications. The in-page modal will work even if desktop notifications are blocked.
