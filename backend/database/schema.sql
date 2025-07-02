-- Create database
CREATE DATABASE IF NOT EXISTS report_system;
USE report_system;

-- Report Templates
CREATE TABLE IF NOT EXISTS report_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Uploaded Files
CREATE TABLE IF NOT EXISTS uploaded_files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('processing', 'completed', 'error') DEFAULT 'processing',
    user_id INT NOT NULL
);

-- Generated Reports
CREATE TABLE IF NOT EXISTS generated_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_id INT,
    file_id INT,
    report_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES report_templates(id),
    FOREIGN KEY (file_id) REFERENCES uploaded_files(id)
);

CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scheduled_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    template_id INT NOT NULL,
    schedule_type ENUM('daily', 'weekly', 'monthly') NOT NULL,
    time_of_day TIME NOT NULL,
    email_notification BOOLEAN DEFAULT FALSE,
    last_run_at TIMESTAMP NULL,
    next_run_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (template_id) REFERENCES report_templates(id)
);
INSERT INTO report_templates (name, description, template_config) VALUES 
('Financial Report', 'Standard financial report with revenue and expense analysis', '{"sections": ["summary", "revenue_trend", "expense_analysis"]}'),
('Performance Report', 'Employee and team performance metrics', '{"sections": ["summary", "performance_metrics", "productivity_trends"]}'),
('Operational Report', 'Daily operational metrics and KPIs', '{"sections": ["summary", "operational_metrics", "kpi_analysis"]}');

