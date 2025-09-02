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
