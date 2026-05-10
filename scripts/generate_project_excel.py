import argparse
import zipfile
from datetime import datetime
from pathlib import Path
from xml.sax.saxutils import escape

from common_api import DEFAULT_BASE_URL, login, request_json


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "reports" / "flight_tracker_project_report.xlsx"


def xml(value):
    return escape(str(value), {'"': "&quot;"})


def load_env():
    env_path = ROOT / ".env"
    values = {}
    if not env_path.exists():
        return values

    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def column_name(index):
    name = ""
    while index:
        index, remainder = divmod(index - 1, 26)
        name = chr(65 + remainder) + name
    return name


def worksheet_xml(rows):
    output = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
        "<sheetData>",
    ]

    for row_index, row in enumerate(rows, start=1):
        output.append(f'<row r="{row_index}">')
        for column_index, value in enumerate(row, start=1):
            cell = f"{column_name(column_index)}{row_index}"
            output.append(f'<c r="{cell}" t="inlineStr"><is><t>{xml(value)}</t></is></c>')
        output.append("</row>")

    output.extend(["</sheetData>", "</worksheet>"])
    return "\n".join(output)


def workbook_xml(sheet_names):
    sheets = []
    for index, name in enumerate(sheet_names, start=1):
        sheets.append(f'<sheet name="{xml(name)}" sheetId="{index}" r:id="rId{index}"/>')

    return "\n".join(
        [
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
            '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
            "<sheets>",
            *sheets,
            "</sheets>",
            "</workbook>",
        ]
    )


def workbook_rels_xml(sheet_count):
    relationships = []
    for index in range(1, sheet_count + 1):
        relationships.append(
            f'<Relationship Id="rId{index}" '
            'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" '
            f'Target="worksheets/sheet{index}.xml"/>'
        )
    relationships.append(
        f'<Relationship Id="rId{sheet_count + 1}" '
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" '
        'Target="styles.xml"/>'
    )

    return "\n".join(
        [
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
            *relationships,
            "</Relationships>",
        ]
    )


def content_types_xml(sheet_count):
    overrides = []
    for index in range(1, sheet_count + 1):
        overrides.append(
            f'<Override PartName="/xl/worksheets/sheet{index}.xml" '
            'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        )

    return "\n".join(
        [
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
            '<Default Extension="xml" ContentType="application/xml"/>',
            '<Override PartName="/xl/workbook.xml" '
            'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
            '<Override PartName="/xl/styles.xml" '
            'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
            *overrides,
            "</Types>",
        ]
    )


def root_rels_xml():
    return "\n".join(
        [
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
            '<Relationship Id="rId1" '
            'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" '
            'Target="xl/workbook.xml"/>',
            "</Relationships>",
        ]
    )


def styles_xml():
    return "\n".join(
        [
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
            '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
            '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>',
            '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>',
            '<borders count="1"><border/></borders>',
            '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
            '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>',
            "</styleSheet>",
        ]
    )


def write_xlsx(path, sheets):
    path.parent.mkdir(parents=True, exist_ok=True)
    names = list(sheets.keys())

    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", content_types_xml(len(names)))
        archive.writestr("_rels/.rels", root_rels_xml())
        archive.writestr("xl/workbook.xml", workbook_xml(names))
        archive.writestr("xl/_rels/workbook.xml.rels", workbook_rels_xml(len(names)))
        archive.writestr("xl/styles.xml", styles_xml())

        for index, name in enumerate(names, start=1):
            archive.writestr(f"xl/worksheets/sheet{index}.xml", worksheet_xml(sheets[name]))


def project_sheets(alert_rows):
    return {
        "Overview": [
            ["Project", "Flight Ticket Tracker"],
            ["Generated At", datetime.now().strftime("%Y-%m-%d %H:%M:%S")],
            ["Frontend", "HTML, CSS, JavaScript"],
            ["Backend", "Node.js, Express"],
            ["Database", "MongoDB local"],
            ["Flight API", "Ignav"],
            ["Currency", "INR"],
            ["Main URL", "http://localhost:3000"],
        ],
        "Env Keys": [
            ["Key", "Purpose", "Safe for GitHub?"],
            ["PORT", "Local server port", "Yes"],
            ["MONGO_URI", "MongoDB connection string", "Usually no"],
            ["JWT_SECRET", "Login token secret", "No"],
            ["IGNAV_API_KEY", "Flight API key", "No"],
            ["IGNAV_BASE_URL", "Ignav API base URL", "Yes"],
        ],
        "Demo Flow": [
            ["Step", "Action"],
            [1, "Register or login"],
            [2, "Search a flight route such as DEL to DXB"],
            [3, "Select a flight from the dropdown"],
            [4, "View details, buy, or set target price alert"],
            [5, "Use payment form and click Pay now"],
            [6, "See Booking successful"],
            [7, "Open Booking status in the corner to see ticket details"],
            [8, "Create target alert and click Check saved alerts now"],
        ],
        "Python Scripts": [
            ["Script", "Use"],
            ["check_setup.py", "Checks .env, API key, and MongoDB"],
            ["health_report.py", "Checks local website UI health"],
            ["test_project.py", "Runs API tests"],
            ["seed_demo_alerts.py", "Creates demo alerts"],
            ["list_alerts.py", "Lists saved alerts"],
            ["check_alerts_once.py", "Checks target alerts once"],
            ["export_alerts_csv.py", "Exports alerts to CSV"],
            ["delete_alerts.py", "Deletes test alerts"],
            ["generate_project_excel.py", "Creates this Excel report"],
        ],
        "Tracked Flights": alert_rows,
    }


def format_date(value):
    if not value:
        return ""
    return str(value).replace("T", " ").replace("Z", "")


def target_status(alert):
    last_price = alert.get("lastPrice")
    target_price = alert.get("targetPrice")
    if last_price is None:
        return "Not checked"
    if float(last_price) <= float(target_price):
        return "Hit target"
    return "Above target"


def fetch_alert_rows(base_url, email, password, check_today=False):
    if not email or not password:
        return [["Info"], ["Run with --email and --password to include tracked flight records."]]

    session = login(base_url, email, password)
    token = session["token"]
    user = session["user"]

    if check_today:
        request_json(base_url, "/api/alerts/check", method="POST", token=token)

    alerts = request_json(base_url, "/api/alerts", token=token).get("alerts", [])
    today = datetime.now().date().isoformat()
    rows = [
        [
            "Report Date",
            "User",
            "Email",
            "Flight Route",
            "Departure",
            "Return",
            "Adults",
            "Currency",
            "Target Price",
            "Last Price",
            "Target Status",
            "Last Checked",
            "Target Hit At",
            "Active",
            "Alert ID",
        ]
    ]

    for alert in alerts:
        rows.append(
            [
                today,
                user["name"],
                user["email"],
                f"{alert['origin']}-{alert['destination']}",
                alert["departureDate"],
                alert.get("returnDate") or "",
                alert.get("adults", 1),
                alert["currency"],
                alert["targetPrice"],
                alert.get("lastPrice") if alert.get("lastPrice") is not None else "",
                target_status(alert),
                format_date(alert.get("lastCheckedAt")),
                format_date(alert.get("lastHitAt")),
                alert["active"],
                alert["_id"],
            ]
        )

    if len(rows) == 1:
        rows.append(["No tracked flights found", "", "", "", "", "", "", "", "", "", "", "", "", "", ""])

    return rows


def fetch_all_user_alert_rows(base_url, admin_key):
    report = request_json(
        base_url,
        "/api/admin/tracking-report",
        timeout=30,
        extra_headers={"X-Admin-Key": admin_key},
    )
    today = datetime.now().date().isoformat()
    rows = [
        [
            "Report Date",
            "User",
            "Email",
            "Flight Route",
            "Departure",
            "Return",
            "Adults",
            "Currency",
            "Target Price",
            "Last Price",
            "Target Status",
            "Last Checked",
            "Target Hit At",
            "Active",
            "Alert ID",
        ]
    ]

    for item in report.get("rows", []):
        rows.append(
            [
                today,
                item["userName"],
                item["userEmail"],
                f"{item['origin']}-{item['destination']}",
                item["departureDate"],
                item.get("returnDate") or "",
                item.get("adults", 1),
                item["currency"],
                item["targetPrice"],
                item.get("lastPrice") if item.get("lastPrice") is not None else "",
                item["targetStatus"],
                format_date(item.get("lastCheckedAt")),
                format_date(item.get("lastHitAt")),
                item["active"],
                item["id"],
            ]
        )

    if len(rows) == 1:
        rows.append(["No tracked flights found", "", "", "", "", "", "", "", "", "", "", "", "", "", ""])

    return rows


def check_all_users(base_url, admin_key):
    return request_json(
        base_url,
        "/api/admin/tracking-report/check-all",
        method="POST",
        timeout=120,
        extra_headers={"X-Admin-Key": admin_key},
    )


def main():
    parser = argparse.ArgumentParser(description="Generate an Excel report for the Flight Ticket Tracker project.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--email", help="Optional account email to include saved alerts.")
    parser.add_argument("--password", help="Optional account password to include saved alerts.")
    parser.add_argument("--all-users", action="store_true", help="Include tracked flights for every user.")
    parser.add_argument("--admin-key", help="Admin report key. Defaults to ADMIN_REPORT_KEY from .env.")
    parser.add_argument("--check-today", action="store_true", help="Run a live alert check before writing the Excel report.")
    parser.add_argument("--out", default=str(DEFAULT_OUTPUT))
    args = parser.parse_args()

    if args.all_users:
        env = load_env()
        admin_key = args.admin_key or env.get("ADMIN_REPORT_KEY")
        if not admin_key:
            raise SystemExit("Add ADMIN_REPORT_KEY to .env or pass --admin-key.")
        if args.check_today:
            check_all_users(args.base_url, admin_key)
        alert_rows = fetch_all_user_alert_rows(args.base_url, admin_key)
    else:
        alert_rows = fetch_alert_rows(args.base_url, args.email, args.password, args.check_today)
    output_path = Path(args.out).resolve()
    write_xlsx(output_path, project_sheets(alert_rows))
    print(f"Excel report created: {output_path}")


if __name__ == "__main__":
    main()
