import argparse

from common_api import DEFAULT_BASE_URL, request_text


def main():
    parser = argparse.ArgumentParser(description="Print a small health report for the local website.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    args = parser.parse_args()

    html = request_text(args.base_url, "/")
    checks = {
        "server reachable": True,
        "login form present": "authForm" in html,
        "dashboard present": "dashboard" in html,
        "payment modal present": "paymentModal" in html,
        "booking status present": "bookingStatusButton" in html,
    }

    for name, ok in checks.items():
        print(f"[{'OK' if ok else 'FIX'}] {name}")

    if not all(checks.values()):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
