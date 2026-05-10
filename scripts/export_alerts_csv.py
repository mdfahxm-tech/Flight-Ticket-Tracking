import argparse
import csv
from pathlib import Path

from common_api import DEFAULT_BASE_URL, login, request_json


def main():
    parser = argparse.ArgumentParser(description="Export saved alerts to a CSV file.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--out", default="alerts_export.csv")
    args = parser.parse_args()

    session = login(args.base_url, args.email, args.password)
    alerts = request_json(args.base_url, "/api/alerts", token=session["token"]).get("alerts", [])
    output_path = Path(args.out).resolve()

    with output_path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(
            file,
            fieldnames=["id", "origin", "destination", "departureDate", "targetPrice", "currency", "lastPrice", "active"],
        )
        writer.writeheader()
        for alert in alerts:
            writer.writerow(
                {
                    "id": alert["_id"],
                    "origin": alert["origin"],
                    "destination": alert["destination"],
                    "departureDate": alert["departureDate"],
                    "targetPrice": alert["targetPrice"],
                    "currency": alert["currency"],
                    "lastPrice": alert.get("lastPrice") or "",
                    "active": alert["active"],
                }
            )

    print(f"Exported {len(alerts)} alert(s) to {output_path}")


if __name__ == "__main__":
    main()
