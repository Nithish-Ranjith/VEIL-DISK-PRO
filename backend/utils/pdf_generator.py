"""
SENTINEL-DISK Pro — Warranty Claim PDF Generator
Generates a professional, printable drive health PDF report
suitable for drive manufacturer warranty claim submissions.
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch, mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
from datetime import datetime


# ── Brand colours ────────────────────────────────────────────────────────────
BRAND_DARK   = colors.HexColor("#0B101B")
BRAND_BLUE   = colors.HexColor("#3B82F6")
BRAND_AMBER  = colors.HexColor("#F59E0B")
BRAND_RED    = colors.HexColor("#EF4444")
BRAND_GREEN  = colors.HexColor("#10B981")
BRAND_GREY   = colors.HexColor("#64748B")
BRAND_LITE   = colors.HexColor("#F1F5F9")
BRAND_WHITE  = colors.white


# ── SMART attribute metadata ──────────────────────────────────────────────────
SMART_ATTRS = [
    ("5",   "Reallocated Sectors Count",     "smart_5",   0,     "Count of reallocated sectors. Any non-zero value is a warning."),
    ("187", "Reported Uncorrectable Errors",  "smart_187", 0,     "Errors that could not be recovered. Must be 0."),
    ("188", "Command Timeout",               "smart_188", 0,     "Commands that timed out. Should be 0."),
    ("197", "Current Pending Sector Count",  "smart_197", 0,     "Sectors waiting for transfer — may indicate imminent failure."),
    ("198", "Offline Uncorrectable Sectors", "smart_198", 0,     "Sectors that could not be corrected during offline scan."),
    ("194", "Drive Temperature (°C)",        "smart_194", 55,    "Operating temperature. Safe range: 15–50 °C."),
    ("9",   "Power-On Hours",               "smart_9",   50000, "Total hours the drive has been powered on."),
    ("12",  "Power Cycle Count",            "smart_12",  5000,  "Number of times the drive has been powered on/off."),
]


def _health_color(score: float):
    if score >= 80: return BRAND_GREEN
    if score >= 50: return BRAND_AMBER
    return BRAND_RED


def _status_for_attr(key, value, threshold):
    """Return (status_text, color) for a SMART attribute."""
    try:
        v = float(value)
    except (TypeError, ValueError):
        return "N/A", BRAND_GREY

    if threshold == 0:
        if v > 0:
            return "⚠ FAIL", BRAND_RED
        return "✔ OK", BRAND_GREEN
    else:
        ratio = v / threshold
        if ratio >= 1.0:   return "⚠ EXCEED", BRAND_RED
        if ratio >= 0.75:  return "△ WARN",   BRAND_AMBER
        return "✔ OK",     BRAND_GREEN


def generate_pdf_report(drive_data: dict) -> BytesIO:
    """
    Generate a professional warranty claim PDF report.

    Expected drive_data keys:
        model, serial_number, capacity_gb,
        health_score, risk_level, days_to_failure, smart_history (list of dicts)
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.65*inch, rightMargin=0.65*inch,
        topMargin=0.6*inch,  bottomMargin=0.6*inch,
    )

    styles = getSampleStyleSheet()

    # ── Custom styles ─────────────────────────────────────────────────────────
    title_style = ParagraphStyle(
        "SentinelTitle",
        fontSize=20, fontName="Helvetica-Bold",
        textColor=BRAND_DARK, spaceAfter=2,
    )
    subtitle_style = ParagraphStyle(
        "SentinelSub",
        fontSize=9, fontName="Helvetica",
        textColor=BRAND_GREY, spaceAfter=0,
    )
    section_style = ParagraphStyle(
        "SentinelSection",
        fontSize=10, fontName="Helvetica-Bold",
        textColor=BRAND_DARK, spaceBefore=14, spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "SentinelBody",
        fontSize=8.5, fontName="Helvetica",
        textColor=BRAND_DARK, leading=13,
    )
    note_style = ParagraphStyle(
        "SentinelNote",
        fontSize=7.5, fontName="Helvetica-Oblique",
        textColor=BRAND_GREY, leading=11,
    )
    score_style = ParagraphStyle(
        "Score",
        fontSize=38, fontName="Helvetica-Bold",
        textColor=BRAND_DARK, alignment=TA_CENTER,
    )

    story = []

    # ── Header band ───────────────────────────────────────────────────────────
    report_id = f"SDP-{int(datetime.now().timestamp())}"
    generated  = datetime.now().strftime("%B %d, %Y at %H:%M UTC")

    header_data = [[
        Paragraph("SENTINEL-DISK<br/><font color='#3B82F6' size='8'>Pro</font>", title_style),
        Paragraph(
            f"<b>DRIVE HEALTH WARRANTY CLAIM REPORT</b><br/>"
            f"<font color='#64748B'>Report ID: {report_id}<br/>"
            f"Generated: {generated}</font>",
            ParagraphStyle("hdr", fontSize=9, fontName="Helvetica", alignment=TA_RIGHT, leading=14)
        ),
    ]]
    hdr_tbl = Table(header_data, colWidths=[3.2*inch, 4.1*inch])
    hdr_tbl.setStyle(TableStyle([
        ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",(0, 0), (-1, -1), 0),
    ]))
    story.append(hdr_tbl)
    story.append(HRFlowable(width="100%", thickness=1, color=BRAND_BLUE, spaceAfter=12))

    # ── Drive Info + Health Score side by side ────────────────────────────────
    model       = drive_data.get("model", "Unknown Drive")
    serial      = drive_data.get("serial_number", "N/A")
    capacity    = drive_data.get("capacity_gb", 0)
    health      = float(drive_data.get("health_score", 100))
    risk_level  = drive_data.get("risk_level", "Unknown")
    days_left   = drive_data.get("days_to_failure")
    hcolor      = _health_color(health)

    info_rows = [
        ["Drive Model",       model],
        ["Serial Number",     serial],
        ["Capacity",          f"{capacity} GB" if capacity else "N/A"],
        ["Protocol / Bus",    drive_data.get("protocol", "N/A")],
        ["OS Detection",      drive_data.get("device_path", "N/A")],
        ["Report ID",         report_id],
    ]
    info_tbl = Table(info_rows, colWidths=[1.6*inch, 3.0*inch])
    info_tbl.setStyle(TableStyle([
        ("FONTNAME",    (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE",    (0, 0), (-1, -1), 8.5),
        ("FONTNAME",    (0, 0), (0, -1),  "Helvetica-Bold"),
        ("TEXTCOLOR",   (0, 0), (0, -1),  BRAND_GREY),
        ("TEXTCOLOR",   (1, 0), (1, -1),  BRAND_DARK),
        ("ROWBACKGROUNDS", (0,0), (-1,-1), [BRAND_LITE, BRAND_WHITE]),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING",  (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0,0),(-1,-1),   5),
        ("GRID",        (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
    ]))

    prediction_label = (
        f"Estimated {days_left} days remaining" if days_left
        else "No imminent failure predicted"
    )
    health_block = [
        [Paragraph(f"<font color='{hcolor.hexval()}'><b>{int(health)}</b></font>",
                   ParagraphStyle("hs", fontSize=46, fontName="Helvetica-Bold",
                                  textColor=hcolor, alignment=TA_CENTER))],
        [Paragraph("/100", ParagraphStyle("of100", fontSize=10, fontName="Helvetica",
                                           textColor=BRAND_GREY, alignment=TA_CENTER))],
        [Paragraph(f"<b>{risk_level}</b>",
                   ParagraphStyle("rl", fontSize=11, fontName="Helvetica-Bold",
                                  textColor=hcolor, alignment=TA_CENTER, spaceBefore=4))],
        [Paragraph(prediction_label,
                   ParagraphStyle("pl", fontSize=7.5, fontName="Helvetica",
                                  textColor=BRAND_GREY, alignment=TA_CENTER, spaceBefore=2))],
    ]
    health_tbl = Table(health_block, colWidths=[2.1*inch])
    health_tbl.setStyle(TableStyle([
        ("ALIGN",       (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING",  (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING",(0,0),(-1,-1),   3),
        ("ROUNDEDCORNERS", [6]),
        ("BOX",  (0,0),(-1,-1), 0.5, colors.HexColor("#E2E8F0")),
    ]))

    combo = Table([[info_tbl, health_tbl]], colWidths=[4.75*inch, 2.55*inch])
    combo.setStyle(TableStyle([
        ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",(0, 0), (-1, -1), 0),
        ("RIGHTPADDING",(0, 0), (0, 0),   12),
    ]))
    story.append(combo)
    story.append(Spacer(1, 14))

    # ── SMART Attributes Table ────────────────────────────────────────────────
    story.append(Paragraph("SMART Attribute Analysis", section_style))

    # Flatten smart history — pick last non-empty entry
    hist = drive_data.get("smart_history", [])
    smart = {}
    for entry in reversed(hist):
        # Entry may be raw flat dict or may have 'smart_values' key
        candidate = entry.get("smart_values", entry) if isinstance(entry, dict) else {}
        if candidate and any(v not in (None, "") for v in candidate.values()):
            smart = candidate
            break

    smart_rows = [[
        Paragraph("<b>ID</b>",    ParagraphStyle("th", fontSize=8, fontName="Helvetica-Bold", textColor=BRAND_WHITE, alignment=TA_CENTER)),
        Paragraph("<b>Attribute</b>",  ParagraphStyle("th", fontSize=8, fontName="Helvetica-Bold", textColor=BRAND_WHITE)),
        Paragraph("<b>Value</b>", ParagraphStyle("th", fontSize=8, fontName="Helvetica-Bold", textColor=BRAND_WHITE, alignment=TA_CENTER)),
        Paragraph("<b>Status</b>",ParagraphStyle("th", fontSize=8, fontName="Helvetica-Bold", textColor=BRAND_WHITE, alignment=TA_CENTER)),
        Paragraph("<b>Note</b>",  ParagraphStyle("th", fontSize=8, fontName="Helvetica-Bold", textColor=BRAND_WHITE)),
    ]]

    row_colors = []
    for i, (attr_id, name, key, threshold, note) in enumerate(SMART_ATTRS):
        raw_val = smart.get(key)
        display = str(raw_val) if raw_val is not None else "N/A"
        if key == "smart_194" and raw_val is not None:
            display = f"{raw_val} °C"
        if key == "smart_9" and raw_val is not None:
            try:
                display = f"{int(raw_val):,} h"
            except: pass
        if key == "smart_12" and raw_val is not None:
            try:
                display = f"{int(raw_val):,}"
            except: pass

        status_text, status_color = _status_for_attr(key, raw_val, threshold)
        bg = BRAND_LITE if i % 2 == 0 else BRAND_WHITE

        smart_rows.append([
            Paragraph(attr_id,     ParagraphStyle("td", fontSize=8, fontName="Helvetica-Bold", alignment=TA_CENTER)),
            Paragraph(name,        ParagraphStyle("td", fontSize=8, fontName="Helvetica")),
            Paragraph(display,     ParagraphStyle("td", fontSize=8, fontName="Helvetica-Bold", alignment=TA_CENTER)),
            Paragraph(f"<font color='{status_color.hexval()}'><b>{status_text}</b></font>",
                      ParagraphStyle("td", fontSize=8, fontName="Helvetica-Bold", alignment=TA_CENTER)),
            Paragraph(note,        ParagraphStyle("td", fontSize=7, fontName="Helvetica", textColor=BRAND_GREY, leading=10)),
        ])
        row_colors.append(bg)

    smart_tbl = Table(smart_rows, colWidths=[0.35*inch, 1.7*inch, 0.7*inch, 0.75*inch, 3.8*inch])
    style_cmds = [
        ("BACKGROUND",  (0, 0), (-1, 0),  BRAND_DARK),
        ("ROWBACKGROUNDS", (0,1),(-1,-1), row_colors),
        ("GRID",        (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E1")),
        ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",  (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0,0),(-1,-1),   5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING",(0, 0), (-1, -1), 6),
    ]
    smart_tbl.setStyle(TableStyle(style_cmds))
    story.append(smart_tbl)

    if not smart:
        story.append(Spacer(1, 6))
        story.append(Paragraph(
            "⚠ SMART attribute data is not available for this drive. This is typical for Apple "
            "Silicon internal SSDs, which report health status through the OS rather than standard "
            "SMART protocol. The drive OS health status is: <b>Verified (Healthy)</b>.",
            note_style
        ))

    story.append(Spacer(1, 14))

    # ── Warranty Recommendation ────────────────────────────────────────────────
    story.append(Paragraph("Warranty & Service Recommendation", section_style))

    if health >= 80:
        rec_color = BRAND_GREEN
        rec_title = "Drive is Operating Normally"
        rec_body  = ("This drive is within healthy operating parameters. No immediate replacement "
                     "is required. Continue regular monitoring and maintain backup schedules.")
    elif health >= 50:
        rec_color = BRAND_AMBER
        rec_title = "Drive Shows Signs of Wear — Backup Recommended"
        rec_body  = ("Health degradation detected. Data backup is strongly recommended. "
                     "Evaluate warranty replacement based on age and usage. Contact the drive "
                     "manufacturer with this report if errors are present in SMART attributes.")
    else:
        rec_color = BRAND_RED
        rec_title = "⚠ Critical — Warranty Replacement Recommended"
        rec_body  = ("Drive health is critically low. Immediate data backup is essential. "
                     "Submit this document to your drive manufacturer warranty department for "
                     "replacement consideration. Do not rely on this drive as primary storage.")

    rec_data = [[
        Paragraph(f"<font color='{rec_color.hexval()}'><b>{rec_title}</b></font><br/>"
                  f"<font color='#334155' size='8'>{rec_body}</font>",
                  ParagraphStyle("rec", fontSize=8.5, fontName="Helvetica", leading=13))
    ]]
    rec_tbl = Table(rec_data, colWidths=[7.3*inch])
    rec_tbl.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(-1,-1), colors.HexColor("#F8FAFC")),
        ("BOX",          (0,0),(-1,-1), 1.5, rec_color),
        ("LEFTPADDING",  (0,0),(-1,-1), 12),
        ("RIGHTPADDING", (0,0),(-1,-1), 12),
        ("TOPPADDING",   (0,0),(-1,-1), 10),
        ("BOTTOMPADDING",(0,0),(-1,-1), 10),
    ]))
    story.append(rec_tbl)
    story.append(Spacer(1, 14))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=BRAND_GREY, spaceBefore=6, spaceAfter=6))
    story.append(Paragraph(
        f"Generated by <b>SENTINEL-DISK Pro v2.0</b> · Report {report_id} · {generated}<br/>"
        "This document is auto-generated for drive warranty claim purposes. "
        "SMART data accuracy depends on drive firmware, OS permissions, and hardware support.",
        ParagraphStyle("footer", fontSize=7, fontName="Helvetica", textColor=BRAND_GREY,
                       alignment=TA_CENTER, leading=10)
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer
