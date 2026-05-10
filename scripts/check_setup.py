from pathlib import Path
from socket import create_connection
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env"


def load_env():
    values = {}
    if not ENV_FILE.exists():
        return values

    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def check_mongo(uri):
    parsed = urlparse(uri)
    host = parsed.hostname or "127.0.0.1"
    port = parsed.port or 27017

    try:
        with create_connection((host, port), timeout=3):
            return True, f"MongoDB is reachable at {host}:{port}"
    except OSError as error:
        return False, f"MongoDB is not reachable at {host}:{port}: {error}"


def main():
    env = load_env()
    mongo_uri = env.get("MONGO_URI", "mongodb://127.0.0.1:27017/flight_ticket_tracker")
    ignav_key = env.get("IGNAV_API_KEY", "")

    checks = []
    checks.append(("ENV file", ENV_FILE.exists(), f"Found {ENV_FILE}"))
    checks.append(("Ignav key", bool(ignav_key and "your_ignav" not in ignav_key), "Ignav API key is set"))
    mongo_ok, mongo_message = check_mongo(mongo_uri)
    checks.append(("MongoDB", mongo_ok, mongo_message))

    print("Flight Tracker Setup Check")
    print("==========================")
    for name, ok, message in checks:
        mark = "OK" if ok else "FIX"
        print(f"[{mark}] {name}: {message}")

    if not all(ok for _, ok, _ in checks):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
