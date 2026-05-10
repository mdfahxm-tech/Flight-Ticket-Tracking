import json
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BASE_URL = "http://localhost:3000"


def request_json(base_url, path, method="GET", token=None, payload=None, timeout=30, extra_headers=None):
    data = None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if extra_headers:
        headers.update(extra_headers)
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")

    request = Request(f"{base_url}{path}", data=data, headers=headers, method=method)

    try:
        with urlopen(request, timeout=timeout) as response:
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


def request_text(base_url, path="/", timeout=15):
    request = Request(f"{base_url}{path}", method="GET")
    try:
        with urlopen(request, timeout=timeout) as response:
            return response.read().decode("utf-8")
    except URLError as error:
        raise RuntimeError(f"Could not reach {base_url}: {error.reason}") from error


def login(base_url, email, password):
    return request_json(
        base_url,
        "/api/auth/login",
        method="POST",
        payload={"email": email, "password": password},
    )


def register(base_url, name, email, password):
    return request_json(
        base_url,
        "/api/auth/register",
        method="POST",
        payload={"name": name, "email": email, "password": password},
    )


def login_or_register(base_url, name, email, password):
    try:
        return login(base_url, email, password)
    except RuntimeError:
        return register(base_url, name, email, password)


def print_table(rows, headers):
    widths = [len(header) for header in headers]
    for row in rows:
        for index, header in enumerate(headers):
            widths[index] = max(widths[index], len(str(row.get(header, ""))))

    line = " | ".join(header.ljust(widths[index]) for index, header in enumerate(headers))
    rule = "-+-".join("-" * width for width in widths)
    print(line)
    print(rule)

    for row in rows:
        print(" | ".join(str(row.get(header, "")).ljust(widths[index]) for index, header in enumerate(headers)))
