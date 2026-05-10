import argparse

from common_api import DEFAULT_BASE_URL, login, print_table, request_json


def main():
    parser = argparse.ArgumentParser(description="List saved price alerts for one account.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    args = parser.parse_args()

    session = login(args.base_url, args.email, args.password)
    alerts = request_json(args.base_url, "/api/alerts", token=session["token"]).get("alerts", [])

    rows = [
        {
            "id": alert["_id"],
            "route": f"{alert['origin']}-{alert['destination']}",
            "date": alert["departureDate"],
            "target": f"{alert['currency']} {alert['targetPrice']}",
            "last": alert.get("lastPrice") or "-",
            "active": alert["active"],
        }
        for alert in alerts
    ]

    if not rows:
        print("No alerts found.")
        return

    print_table(rows, ["id", "route", "date", "target", "last", "active"])


if __name__ == "__main__":
    main()
