/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Auth
export interface LoginRequest {
  username: string;
  password: string;
}
export interface LoginResponse {
  success: boolean;
  token?: string; // optional
  message?: string;
}

// Upload
export interface UploadResponse {
  id: number;
  fileName: string;
  uploadedAt: string;
}

// Employee
export interface EmployeeCreateRequest {
  name: string;
  department: string;
  email?: string;
}
export interface Employee {
  id: number;
  employeeId: string; // e.g. EMP20250101-1234
  name: string;
  department: string;
  email?: string;
  createdAt: string;
}

// Assessment Types
export interface Assessment {
  id: string;
  title: string;
  description: string;
  type: 'skills' | 'performance' | 'training' | 'compliance' | '360_feedback';
  category: string;
  duration_minutes: number;
  passing_score: number;
  total_questions: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssessmentQuestion {
  id: string;
  assessment_id: string;
  question_text: string;
  question_type: 'mcq' | 'essay' | 'rating_scale' | 'true_false';
  options?: string[];
  correct_answer?: string;
  max_score: number;
  order_index: number;
}

export interface AssessmentAttempt {
  id: string;
  assessment_id: string;
  employee_id: string;
  started_at: string;
  completed_at?: string;
  score?: number;
  max_score: number;
  passed: boolean;
  status: 'in_progress' | 'completed' | 'abandoned';
}

export interface AssessmentResponse {
  id: string;
  attempt_id: string;
  question_id: string;
  answer_text?: string;
  selected_option?: string;
  rating_score?: number;
  score_earned: number;
  feedback?: string;
}

export interface PerformanceEvaluation {
  id: string;
  employee_id: string;
  evaluator_id: string;
  evaluation_period: string;
  evaluation_date: string;
  overall_rating: number;
  comments: string;
  goals: string[];
  achievements: string[];
  areas_for_improvement: string[];
  next_review_date: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_hours: number;
  required: boolean;
  completion_criteria: string;
  created_at: string;
}

export interface TrainingProgress {
  id: string;
  employee_id: string;
  module_id: string;
  started_at: string;
  completed_at?: string;
  progress_percentage: number;
  status: 'not_started' | 'in_progress' | 'completed';
  score?: number;
}

export interface ComplianceQuiz {
  id: string;
  title: string;
  description: string;
  category: string;
  due_date: string;
  passing_score: number;
  is_mandatory: boolean;
  retake_allowed: boolean;
  max_attempts: number;
}

export interface Feedback360 {
  id: string;
  employee_id: string;
  reviewer_id: string;
  review_period: string;
  review_date: string;
  communication_rating: number;
  teamwork_rating: number;
  problem_solving_rating: number;
  leadership_rating: number;
  overall_rating: number;
  strengths: string[];
  areas_for_improvement: string[];
  comments: string;
}

// Enhanced Employee Data
export interface EmployeeProfile extends Employee {
  onboarding_data?: OnboardingData;
  assessments: AssessmentAttempt[];
  performance_evaluations: PerformanceEvaluation[];
  training_progress: TrainingProgress[];
  compliance_quizzes: AssessmentAttempt[];
  feedback_360: Feedback360[];
  documents: EmployeeDocument[];
}

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  document_type: 'id_proof' | 'certificate' | 'contract' | 'photo' | 'other';
  file_name: string;
  file_url: string;
  uploaded_at: string;
  verified: boolean;
  verified_by?: string;
  verified_at?: string;
}

export interface OnboardingData {
  id: string;
  employee_id: string;
  // ... existing onboarding fields from your current form
  employee_name: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  marital_status: string;
  number_of_kids: number;
  personal_email: string;
  contact_number: string;
  current_address: string;
  current_city: string;
  state: string;
  joining_date: string;
  reporting_manager: string;
  office_time: string;
  office_department: string;
  job_status: string;
  job_title: string;
  aadhar_card: string;
  pan_number: string;
  driving_license: string;
  emergency_contact_person: string;
  emergency_contact_number: string;
  emergency_relationship: string;
  blood_type: string;
  has_health_problem: boolean;
  health_problem_details: string;
  account_holder_name: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  nominee_name: string;
  nominee_relation: string;
  nominee_gender: string;
  nominee_date_of_birth: string;
  nominee_aadhar_number: string;
  previous_company_name: string;
  graduation_degree: string;
  completed: boolean;
  submitted_at: string;
}

// Dashboard Analytics
export interface AssessmentAnalytics {
  total_assessments: number;
  completed_assessments: number;
  average_score: number;
  pass_rate: number;
  top_performers: Array<{
    employee_id: string;
    employee_name: string;
    average_score: number;
  }>;
  assessment_type_breakdown: Array<{
    type: string;
    count: number;
    average_score: number;
  }>;
}

export interface PerformanceAnalytics {
  total_evaluations: number;
  average_rating: number;
  rating_distribution: Array<{
    rating: number;
    count: number;
    percentage: number;
  }>;
  department_performance: Array<{
    department: string;
    average_rating: number;
    employee_count: number;
  }>;
}

export interface TrainingAnalytics {
  total_modules: number;
  completed_modules: number;
  completion_rate: number;
  average_progress: number;
  overdue_trainings: Array<{
    employee_id: string;
    employee_name: string;
    module_title: string;
    days_overdue: number;
  }>;
}

export interface ComplianceAnalytics {
  total_quizzes: number;
  completed_quizzes: number;
  compliance_rate: number;
  overdue_compliance: Array<{
    employee_id: string;
    employee_name: string;
    quiz_title: string;
    days_overdue: number;
  }>;
}
