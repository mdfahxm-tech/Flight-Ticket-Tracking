import argparse

from common_api import DEFAULT_BASE_URL, login, request_json


def main():
    parser = argparse.ArgumentParser(description="Delete alerts for an account.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--all", action="store_true", help="Delete every alert in the account.")
    parser.add_argument("--id", dest="alert_id", help="Delete one specific alert id.")
    args = parser.parse_args()

    if not args.all and not args.alert_id:
        raise SystemExit("Use --id ALERT_ID or --all")

    session = login(args.base_url, args.email, args.password)
    token = session["token"]

    if args.alert_id:
        request_json(args.base_url, f"/api/alerts/{args.alert_id}", method="DELETE", token=token)
        print(f"Deleted alert {args.alert_id}")
        return

    alerts = request_json(args.base_url, "/api/alerts", token=token).get("alerts", [])
    for alert in alerts:
        request_json(args.base_url, f"/api/alerts/{alert['_id']}", method="DELETE", token=token)
        print(f"Deleted alert {alert['_id']}")

    print(f"Deleted {len(alerts)} alert(s).")


if __name__ == "__main__":
    main()
