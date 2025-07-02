# API Documentation

## Authentication
`POST /api/auth/register` - Register a new user  
`POST /api/auth/login` - Login and get JWT token

## Reports
`POST /api/reports/upload` - Upload a file for report generation  
`GET /api/reports` - List all reports for current user  
`GET /api/reports/<id>` - Get specific report details

## Templates
`GET /api/templates` - List all available report templates

## Data Formats
All responses are JSON with standard format:
```json
{
  "status": "success|error",
  "message": "Descriptive message",
  "data": {
    // Endpoint-specific data
  }
}