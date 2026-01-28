import { z } from "zod";

// Enums
export const UserRole = z.enum(["admin", "teacher", "student", "parent"]);
export type UserRole = z.infer<typeof UserRole>;

export const AttendanceStatus = z.enum(["Present", "Absent", "Late"]);
export type AttendanceStatus = z.infer<typeof AttendanceStatus>;

export const FeeStatus = z.enum(["Pending", "Cleared"]);
export type FeeStatus = z.infer<typeof FeeStatus>;

// --- Users ---
export const insertUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: UserRole,
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  contact: z.string().optional(),
  profilePicture: z.string().optional(),
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = InsertUser & { id: string; createdAt: Date };

export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});
export type LoginRequest = z.infer<typeof loginSchema>;

// --- Academic Structure ---
export const insertClassSchema = z.object({
  name: z.string().min(1, "Class name is required"), // e.g. "Grade 10"
  subjects: z.array(z.string()).min(1, "At least one subject is required"),
});
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = InsertClass & { id: string };

export const insertSectionSchema = z.object({
  name: z.string().min(1, "Section name is required"), // e.g. "A"
  classId: z.string(),
  roomNumber: z.string().optional(),
  classTeacherId: z.string().optional(), // User ID of role 'teacher'
});
export type InsertSection = z.infer<typeof insertSectionSchema>;
export type Section = InsertSection & { id: string };

// --- Students ---
export const insertStudentSchema = z.object({
  userId: z.string(), // Link to User
  admissionNumber: z.string(),
  rollNumber: z.string(),
  classId: z.string(),
  sectionId: z.string(),
  guardianName: z.string(),
  guardianContact: z.string(),
  guardianEmail: z.string().email().optional(),
});
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = InsertStudent & { id: string };

// --- Attendance ---
export const insertAttendanceSchema = z.object({
  date: z.string(), // ISO Date string YYYY-MM-DD
  studentId: z.string(),
  classId: z.string(),
  sectionId: z.string(),
  status: AttendanceStatus,
});
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = InsertAttendance & { id: string };

export const bulkAttendanceSchema = z.object({
  date: z.string(),
  classId: z.string(),
  sectionId: z.string(),
  records: z.array(z.object({
    studentId: z.string(),
    status: AttendanceStatus,
  })),
});
export type BulkAttendanceRequest = z.infer<typeof bulkAttendanceSchema>;

// --- Assignments ---
export const insertAssignmentSchema = z.object({
  title: z.string().min(3),
  description: z.string(),
  classId: z.string(),
  sectionId: z.string().optional(), // Optional: assign to specific section or whole class
  subject: z.string(),
  deadline: z.string(), // ISO Date string
  teacherId: z.string(),
});
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = InsertAssignment & { id: string };

export const insertSubmissionSchema = z.object({
  assignmentId: z.string(),
  studentId: z.string(),
  link: z.string().url("Must be a valid URL"),
});
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = InsertSubmission & { 
  id: string; 
  submittedAt: Date;
  grade?: string;
  feedback?: string;
  gradedAt?: Date;
};

export const gradeSubmissionSchema = z.object({
  grade: z.string(),
  feedback: z.string().optional(),
});
export type GradeSubmissionRequest = z.infer<typeof gradeSubmissionSchema>;

// --- Fees ---
export const insertFeeSchema = z.object({
  studentId: z.string(),
  amount: z.number().positive(),
  period: z.string(), // e.g. "October 2023"
  dueDate: z.string(),
  status: FeeStatus.default("Pending"),
});
export type InsertFee = z.infer<typeof insertFeeSchema>;
export type Fee = InsertFee & { id: string; paidDate?: Date };

// --- Types for Frontend ---
export type StudentWithDetails = Student & { 
  user: User; 
  class: Class;
  section: Section;
};

export type AuthResponse = {
  token: string;
  user: User;
};
