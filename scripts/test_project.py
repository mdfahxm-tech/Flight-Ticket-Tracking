import argparse
import json
import time
from datetime import date, timedelta
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def request_json(base_url, path, method="GET", token=None, payload=None):
    data = None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")

    request = Request(f"{base_url}{path}", data=data, headers=headers, method=method)

    try:
        with urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8")
            return json.loads(body) if body else {}
    except HTTPError as error:
        body = error.read().decode("utf-8")
        try:
            message = json.loads(body).get("message", body)
        except json.JSONDecodeError:
            message = body
        raise RuntimeError(f"{method} {path} failed: {error.code} {message}") from error
    except URLError as error:
        raise RuntimeError(f"Could not reach {base_url}: {error.reason}") from error


def request_text(base_url, path):
    request = Request(f"{base_url}{path}", method="GET")
    try:
        with urlopen(request, timeout=15) as response:
            return response.read().decode("utf-8")
    except URLError as error:
        raise RuntimeError(f"Could not reach {base_url}: {error.reason}") from error


def print_step(message):
    print(f"[TEST] {message}")


def main():
    parser = argparse.ArgumentParser(description="Test the local Flight Ticket Tracker APIs.")
    parser.add_argument("--base-url", default="http://localhost:3000")
    parser.add_argument("--from", dest="origin", default="DEL")
    parser.add_argument("--to", dest="destination", default="DXB")
    parser.add_argument("--departure-date", default=(date.today() + timedelta(days=30)).isoformat())
    parser.add_argument("--target-price", type=int, default=99999999)
    parser.add_argument("--skip-flight-api", action="store_true", help="Skip live flight search if API quota/key is unavailable.")
    args = parser.parse_args()

    unique = int(time.time())
    email = f"test-{unique}@example.com"
    password = "password123"
    token = None
    alert_id = None

    print_step("Checking server is running")
    request_text(args.base_url, "/")
    print_step("Server responded")

    print_step("Registering test user")
    registered = request_json(
        args.base_url,
        "/api/auth/register",
        method="POST",
        payload={"name": "Project Test User", "email": email, "password": password},
    )
    token = registered["token"]
    print_step(f"Registered {email}")

    print_step("Checking current user endpoint")
    me = request_json(args.base_url, "/api/me", token=token)
    print_step(f"Logged in as {me['user']['email']}")

    flight_input = {
        "origin": args.origin.upper(),
        "destination": args.destination.upper(),
        "departureDate": args.departure_date,
        "returnDate": "",
        "adults": 1,
        "currency": "INR",
    }

    if args.skip_flight_api:
        print_step("Skipping live flight search")
    else:
        print_step("Searching live flights")
        flights = request_json(args.base_url, "/api/flights/search", method="POST", token=token, payload=flight_input)
        print_step(f"Flight search returned {len(flights.get('offers', []))} offer(s)")

    print_step("Creating target price alert")
    alert_payload = {**flight_input, "targetPrice": args.target_price}
    created = request_json(args.base_url, "/api/alerts", method="POST", token=token, payload=alert_payload)
    alert_id = created["alert"]["_id"]
    print_step(f"Created alert {alert_id}")

    print_step("Listing saved alerts")
    alerts = request_json(args.base_url, "/api/alerts", token=token)
    print_step(f"Saved alerts count: {len(alerts.get('alerts', []))}")

    if args.skip_flight_api:
        print_step("Skipping target check")
    else:
        print_step("Checking alerts against live prices")
        checked = request_json(args.base_url, "/api/alerts/check", method="POST", token=token)
        hit_count = sum(1 for item in checked.get("results", []) if item.get("hitTarget"))
        print_step(f"Target hit count: {hit_count}")

    print_step("Deleting test alert")
    request_json(args.base_url, f"/api/alerts/{alert_id}", method="DELETE", token=token)
    print_step("Deleted test alert")

    print("")
    print("All selected tests passed.")


if __name__ == "__main__":
    main()
