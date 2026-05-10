import argparse
import json
from datetime import date, timedelta
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def request_json(url, method="GET", token=None, payload=None):
    data = None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")

    request = Request(url, data=data, headers=headers, method=method)
    try:
      with urlopen(request, timeout=15) as response:
          body = response.read().decode("utf-8")
          return json.loads(body) if body else {}
    except HTTPError as error:
        body = error.read().decode("utf-8")
        try:
            message = json.loads(body).get("message", body)
        except json.JSONDecodeError:
            message = body
        raise RuntimeError(f"{error.code}: {message}") from error
    except URLError as error:
        raise RuntimeError(f"Could not reach local app: {error.reason}") from error


def login_or_register(base_url, name, email, password):
    try:
        return request_json(
            f"{base_url}/api/auth/login",
            method="POST",
            payload={"email": email, "password": password},
        )
    except RuntimeError:
        return request_json(
            f"{base_url}/api/auth/register",
            method="POST",
            payload={"name": name, "email": email, "password": password},
        )


def main():
    parser = argparse.ArgumentParser(description="Create a high target-price alert for local testing.")
    parser.add_argument("--base-url", default="http://localhost:3000")
    parser.add_argument("--name", default="Test User")
    parser.add_argument("--email", default="target-test@example.com")
    parser.add_argument("--password", default="password123")
    parser.add_argument("--from", dest="origin", default="DEL")
    parser.add_argument("--to", dest="destination", default="DXB")
    parser.add_argument("--departure-date", default=(date.today() + timedelta(days=30)).isoformat())
    parser.add_argument("--target-price", type=int, default=99999999)
    args = parser.parse_args()

    session = login_or_register(args.base_url, args.name, args.email, args.password)
    token = session["token"]

    alert = {
        "origin": args.origin.upper(),
        "destination": args.destination.upper(),
        "departureDate": args.departure_date,
        "returnDate": "",
        "adults": 1,
        "currency": "INR",
        "targetPrice": args.target_price,
    }

    created = request_json(f"{args.base_url}/api/alerts", method="POST", token=token, payload=alert)
    alert_id = created["alert"]["_id"]

    print("Fake target alert created.")
    print(f"Login email: {args.email}")
    print(f"Login password: {args.password}")
    print(f"Route: {alert['origin']} to {alert['destination']}")
    print(f"Departure: {alert['departureDate']}")
    print(f"Target price: INR {alert['targetPrice']}")
    print(f"Alert id: {alert_id}")
    print("")
    print("Now open the website, log in with the email above, and click 'Check saved alerts now'.")
    print("If the API returns any flight below this high target price, the target pop-up should appear.")


if __name__ == "__main__":
    main()
