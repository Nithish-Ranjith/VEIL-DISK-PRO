from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from io import BytesIO
from datetime import datetime

def generate_pdf_report(drive_data):
    """
    Generate a PDF report for the given drive data.
    Returns a BytesIO object containing the PDF.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Title
    story.append(Paragraph(f"SENTINEL-DISK Pro Health Report", styles['Title']))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    story.append(Spacer(1, 24))

    # Drive Info Table
    info_data = [
        ["Drive Model", drive_data['model']],
        ["Serial Number", drive_data['serial_number']],
        ["Capacity", f"{drive_data['capacity_gb']} GB"],
        ["Report ID", f"RPT-{int(datetime.now().timestamp())}"]
    ]
    t_info = Table(info_data, colWidths=[150, 300])
    t_info.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BACKGROUND', (0, 0), (-1, -1), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    story.append(t_info)
    story.append(Spacer(1, 24))

    # Health Summary
    health_score = drive_data['health_score']
    # Use color names as strings to be safe or explicit Color objects
    if health_score >= 80:
        health_color = colors.green
        status_text = "Good"
    elif health_score >= 40:
        health_color = colors.orange
        status_text = "Warning" 
    else:
        health_color = colors.red
        status_text = "Critical"

    story.append(Paragraph(f"Health Score: {health_score}/100", ParagraphStyle('Health', parent=styles['Heading2'], textColor=health_color)))
    story.append(Paragraph(f"Status: {drive_data['risk_level']}", styles['Normal']))
    
    prediction_text = f"Failure likely in {drive_data['days_to_failure']} days" if drive_data['days_to_failure'] else "No immediate failure predicted."
    story.append(Paragraph(f"Prediction: {prediction_text}", styles['Normal']))
    story.append(Spacer(1, 24))

    # SMART Data Table
    story.append(Paragraph("Critical SMART Attributes", styles['Heading2']))
    story.append(Spacer(1, 12))
    
    # Ensure smart history exists and get last entry
    smart = drive_data.get('smart_history', [])[-1] if drive_data.get('smart_history') else {}
    
    smart_rows = [
        ['ID', 'Attribute Name', 'Value', 'Threshold', 'Status']
    ]
    
    # Helper for row data
    def add_row(id_val, name, key, thresh):
        val = smart.get(key, 'N/A')
        status = 'OK'
        # Simple threshold logic
        try:
            v_int = int(val)
            if key == 'smart_5' and v_int > 5: status = 'FAIL'
            elif key == 'smart_187' and v_int > 0: status = 'FAIL'
            elif key == 'smart_197' and v_int > 0: status = 'FAIL'
            elif key == 'smart_198' and v_int > 0: status = 'FAIL'
            elif key == 'smart_194' and v_int > 50: status = 'WARN'
        except:
            pass
        smart_rows.append([id_val, name, str(val), str(thresh), status])

    add_row('5', 'Reallocated Sectors', 'smart_5', 5)
    add_row('187', 'Reported Uncorrectable', 'smart_187', 0)
    add_row('197', 'Current Pending Sector', 'smart_197', 0)
    add_row('198', 'Offline Uncorrectable', 'smart_198', 0)
    add_row('194', 'Temperature', 'smart_194', 50)
    add_row('9', 'Power-On Hours', 'smart_9', 50000)

    t_smart = Table(smart_rows, colWidths=[40, 200, 80, 80, 80])
    t_smart.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    story.append(t_smart)
    story.append(Spacer(1, 24))

    # Recommendation
    rec_text = "Standard monitoring recommended."
    rec_color = colors.black
    if health_score < 40:
        rec_text = "CRITICAL: Back up data immediately and replace drive."
        rec_color = colors.red
    elif health_score < 80:
        rec_text = "WARNING: Schedule backup and monitor daily."
        rec_color = colors.orange
        
    story.append(Paragraph("Recommendation", styles['Heading2']))
    story.append(Paragraph(rec_text, ParagraphStyle('Rec', parent=styles['Normal'], textColor=rec_color)))

    doc.build(story)
    buffer.seek(0)
    return buffer
