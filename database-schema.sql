-- PulseHR Database Schema
-- This file contains all the necessary tables for the comprehensive HR system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Employees table (existing)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee onboarding data (existing)
CREATE TABLE IF NOT EXISTS employee_onboarding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    employee_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    nationality VARCHAR(100),
    marital_status VARCHAR(20),
    number_of_kids INTEGER DEFAULT 0,
    personal_email VARCHAR(255),
    contact_number VARCHAR(20),
    current_address TEXT,
    current_city VARCHAR(100),
    state VARCHAR(100),
    joining_date DATE,
    reporting_manager VARCHAR(255),
    office_time VARCHAR(100),
    office_department VARCHAR(100),
    job_status VARCHAR(50),
    job_title VARCHAR(255),
    aadhar_card VARCHAR(20),
    pan_number VARCHAR(20),
    driving_license VARCHAR(50),
    emergency_contact_person VARCHAR(255),
    emergency_contact_number VARCHAR(20),
    emergency_relationship VARCHAR(100),
    blood_type VARCHAR(10),
    has_health_problem BOOLEAN DEFAULT FALSE,
    health_problem_details TEXT,
    account_holder_name VARCHAR(255),
    bank_name VARCHAR(255),
    account_number VARCHAR(50),
    ifsc_code VARCHAR(20),
    nominee_name VARCHAR(255),
    nominee_relation VARCHAR(100),
    nominee_gender VARCHAR(20),
    nominee_date_of_birth DATE,
    nominee_aadhar_number VARCHAR(20),
    previous_company_name VARCHAR(255),
    graduation_degree VARCHAR(255),
    completed BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee documents
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('id_proof', 'certificate', 'contract', 'photo', 'other')),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES employees(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('skills', 'performance', 'training', 'compliance', '360_feedback')),
    category VARCHAR(100),
    duration_minutes INTEGER NOT NULL,
    passing_score INTEGER NOT NULL CHECK (passing_score >= 0 AND passing_score <= 100),
    total_questions INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment questions
CREATE TABLE IF NOT EXISTS assessment_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('mcq', 'essay', 'rating_scale', 'true_false')),
    options TEXT[], -- For MCQ questions
    correct_answer TEXT, -- For MCQ and true/false questions
    max_score INTEGER NOT NULL DEFAULT 1,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment attempts
CREATE TABLE IF NOT EXISTS assessment_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    score INTEGER,
    max_score INTEGER NOT NULL,
    passed BOOLEAN,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment responses
CREATE TABLE IF NOT EXISTS assessment_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES assessment_questions(id) ON DELETE CASCADE,
    answer_text TEXT, -- For essay questions
    selected_option TEXT, -- For MCQ questions
    rating_score INTEGER, -- For rating scale questions
    score_earned INTEGER NOT NULL DEFAULT 0,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance evaluations
CREATE TABLE IF NOT EXISTS performance_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    evaluator_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    evaluation_period VARCHAR(100) NOT NULL, -- e.g., "Q1 2024", "Annual 2024"
    evaluation_date DATE NOT NULL,
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    comments TEXT,
    goals TEXT[], -- Array of goal strings
    achievements TEXT[], -- Array of achievement strings
    areas_for_improvement TEXT[], -- Array of improvement areas
    next_review_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training modules
CREATE TABLE IF NOT EXISTS training_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    duration_hours DECIMAL(5,2) NOT NULL,
    required BOOLEAN DEFAULT FALSE,
    completion_criteria TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training progress
CREATE TABLE IF NOT EXISTS training_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    status VARCHAR(50) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance quizzes
CREATE TABLE IF NOT EXISTS compliance_quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    due_date DATE NOT NULL,
    passing_score INTEGER NOT NULL CHECK (passing_score >= 0 AND passing_score <= 100),
    is_mandatory BOOLEAN DEFAULT TRUE,
    retake_allowed BOOLEAN DEFAULT TRUE,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 360-degree feedback
CREATE TABLE IF NOT EXISTS feedback_360 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    review_period VARCHAR(100) NOT NULL,
    review_date DATE NOT NULL,
    communication_rating INTEGER NOT NULL CHECK (communication_rating >= 1 AND communication_rating <= 5),
    teamwork_rating INTEGER NOT NULL CHECK (teamwork_rating >= 1 AND teamwork_rating <= 5),
    problem_solving_rating INTEGER NOT NULL CHECK (problem_solving_rating >= 1 AND problem_solving_rating <= 5),
    leadership_rating INTEGER NOT NULL CHECK (leadership_rating >= 1 AND leadership_rating <= 5),
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    strengths TEXT[], -- Array of strength strings
    areas_for_improvement TEXT[], -- Array of improvement areas
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PDF files (existing)
CREATE TABLE IF NOT EXISTS pdf_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    size_bytes BIGINT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    content_base64 TEXT,
    extracted_policies JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policy reads (existing)
CREATE TABLE IF NOT EXISTS policy_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    policy_id UUID REFERENCES pdf_files(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_onboarding_employee_id ON employee_onboarding(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(type);
CREATE INDEX IF NOT EXISTS idx_assessments_active ON assessments(is_active);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment_id ON assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_employee_id ON assessment_attempts(employee_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment_id ON assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_attempt_id ON assessment_responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_performance_evaluations_employee_id ON performance_evaluations(employee_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_employee_id ON training_progress(employee_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_module_id ON training_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_compliance_quizzes_due_date ON compliance_quizzes(due_date);
CREATE INDEX IF NOT EXISTS idx_feedback_360_employee_id ON feedback_360(employee_id);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_onboarding_unique ON employee_onboarding(employee_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_training_progress_unique ON training_progress(employee_id, module_id);

-- Insert sample data for testing
INSERT INTO assessments (title, description, type, category, duration_minutes, passing_score, total_questions) VALUES
('Basic Skills Assessment', 'Test fundamental workplace skills', 'skills', 'General', 30, 70, 20),
('Safety Compliance Quiz', 'Workplace safety and compliance test', 'compliance', 'Safety', 15, 80, 10),
('Teamwork Evaluation', '360-degree feedback on teamwork', '360_feedback', 'Soft Skills', 20, 60, 15)
ON CONFLICT DO NOTHING;

-- Insert sample training modules
INSERT INTO training_modules (title, description, category, duration_hours, required, completion_criteria) VALUES
('Workplace Safety', 'Basic workplace safety guidelines', 'Safety', 2.0, true, 'Complete all modules and pass final test'),
('Communication Skills', 'Effective communication in the workplace', 'Soft Skills', 1.5, false, 'Complete all modules'),
('Technical Training', 'Job-specific technical skills', 'Technical', 4.0, true, 'Complete all modules and demonstrate skills')
ON CONFLICT DO NOTHING;
