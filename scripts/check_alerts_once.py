import argparse

from common_api import DEFAULT_BASE_URL, login, print_table, request_json


def main():
    parser = argparse.ArgumentParser(description="Run one live target-price check for saved alerts.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    args = parser.parse_args()

    session = login(args.base_url, args.email, args.password)
    checked = request_json(args.base_url, "/api/alerts/check", method="POST", token=session["token"])

    rows = [
        {
            "route": f"{item['origin']}-{item['destination']}",
            "target": f"{item['currency']} {item['targetPrice']}",
            "last": item.get("lastPrice") or "-",
            "hit": item["hitTarget"],
        }
        for item in checked.get("results", [])
    ]

    if not rows:
        print("No active alerts to check.")
        return

    print_table(rows, ["route", "target", "last", "hit"])


if __name__ == "__main__":
    main()
