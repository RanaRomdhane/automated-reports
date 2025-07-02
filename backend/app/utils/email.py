import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import Config
from app.models.file import UploadedFile
from app.models.user import User
from app import db

def send_email_notification(to_email, subject, body):
    if not all([Config.SMTP_SERVER, Config.SMTP_PORT, 
                Config.SMTP_USERNAME, Config.SMTP_PASSWORD]):
        print("Email configuration not set. Skipping email notification.")
        return False
    
    try:
        msg = MIMEMultipart()
        msg['From'] = Config.EMAIL_FROM
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))
        
        with smtplib.SMTP(Config.SMTP_SERVER, Config.SMTP_PORT) as server:
            server.starttls()
            server.login(Config.SMTP_USERNAME, Config.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False

def send_report_notification(file_id, report_id):
    result = db.session.query(
        User.email,
        UploadedFile.filename
    ).join(
        UploadedFile, User.id == UploadedFile.user_id
    ).filter(
        UploadedFile.id == file_id
    ).first()
    
    if result:
        email, filename = result
        email_body = f"""
        <h1>Your Report is Ready</h1>
        <p>Your report for file "{filename}" (ID: {report_id}) has been successfully generated.</p>
        <p>You can view it at: {Config.FRONTEND_URL}/reports/{report_id}</p>
        """
        send_email_notification(email, 'Your Report is Ready', email_body)