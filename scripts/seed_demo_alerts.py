import argparse
from datetime import date, timedelta

from common_api import DEFAULT_BASE_URL, login_or_register, request_json


ROUTES = [
    ("DEL", "DXB", 99999999),
    ("DEL", "BOM", 25000),
    ("BOM", "BLR", 18000),
]


def main():
    parser = argparse.ArgumentParser(description="Create demo price alerts for learning/testing.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--name", default="Demo User")
    parser.add_argument("--email", default="demo@example.com")
    parser.add_argument("--password", default="password123")
    args = parser.parse_args()

    session = login_or_register(args.base_url, args.name, args.email, args.password)
    token = session["token"]
    departure = (date.today() + timedelta(days=30)).isoformat()

    for origin, destination, target_price in ROUTES:
        payload = {
            "origin": origin,
            "destination": destination,
            "departureDate": departure,
            "returnDate": "",
            "adults": 1,
            "currency": "INR",
            "targetPrice": target_price,
        }
        created = request_json(args.base_url, "/api/alerts", method="POST", token=token, payload=payload)
        print(f"Created {origin}-{destination}: {created['alert']['_id']}")

    print("")
    print(f"Login email: {args.email}")
    print(f"Login password: {args.password}")


if __name__ == "__main__":
    main()
