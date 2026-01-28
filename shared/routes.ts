import { z } from 'zod';
import { 
  insertUserSchema, 
  loginSchema, 
  insertClassSchema, 
  insertSectionSchema, 
  insertStudentSchema, 
  bulkAttendanceSchema, 
  insertAssignmentSchema, 
  insertSubmissionSchema, 
  gradeSubmissionSchema,
  insertFeeSchema,
  UserRole
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: loginSchema,
      responses: {
        200: z.object({ token: z.string(), user: z.any() }),
        401: errorSchemas.unauthorized,
      },
    },
    register: {
      method: 'POST' as const,
      path: '/api/auth/register',
      input: insertUserSchema,
      responses: {
        201: z.any(), // Returns created User
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: z.any(), // Returns User
        401: errorSchemas.unauthorized,
      },
    },
  },
  
  classes: {
    list: {
      method: 'GET' as const,
      path: '/api/classes',
      responses: { 200: z.array(z.any()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/classes',
      input: insertClassSchema,
      responses: { 201: z.any() },
    },
    get: {
      method: 'GET' as const,
      path: '/api/classes/:id',
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    },
  },

  sections: {
    list: {
      method: 'GET' as const,
      path: '/api/classes/:classId/sections',
      responses: { 200: z.array(z.any()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/sections',
      input: insertSectionSchema,
      responses: { 201: z.any() },
    },
  },

  students: {
    list: {
      method: 'GET' as const,
      path: '/api/students',
      responses: { 200: z.array(z.any()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/students',
      input: insertStudentSchema,
      responses: { 201: z.any() },
    },
    get: {
      method: 'GET' as const,
      path: '/api/students/:id',
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    },
  },

  attendance: {
    bulkMark: {
      method: 'POST' as const,
      path: '/api/attendance/bulk',
      input: bulkAttendanceSchema,
      responses: { 201: z.object({ message: z.string(), count: z.number() }) },
    },
    getByClassDate: {
      method: 'GET' as const,
      path: '/api/attendance/class/:classId/section/:sectionId/date/:date',
      responses: { 200: z.array(z.any()) },
    },
    getStats: {
      method: 'GET' as const,
      path: '/api/attendance/stats', // ?studentId=...
      responses: { 200: z.any() },
    },
  },

  assignments: {
    list: {
      method: 'GET' as const,
      path: '/api/assignments', // ?classId=...&studentId=...
      responses: { 200: z.array(z.any()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/assignments',
      input: insertAssignmentSchema,
      responses: { 201: z.any() },
    },
    submit: {
      method: 'POST' as const,
      path: '/api/assignments/:id/submit',
      input: insertSubmissionSchema.omit({ assignmentId: true, studentId: true }), // studentId from auth
      responses: { 201: z.any() },
    },
    grade: {
      method: 'POST' as const,
      path: '/api/submissions/:id/grade',
      input: gradeSubmissionSchema,
      responses: { 200: z.any() },
    },
  },

  fees: {
    list: {
      method: 'GET' as const,
      path: '/api/fees', // ?studentId=...
      responses: { 200: z.array(z.any()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/fees',
      input: insertFeeSchema,
      responses: { 201: z.any() },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/fees/:id/status',
      input: z.object({ status: z.enum(["Pending", "Cleared"]) }),
      responses: { 200: z.any() },
    },
  },

  analytics: {
    dashboard: {
      method: 'GET' as const,
      path: '/api/analytics/dashboard',
      responses: { 
        200: z.object({
          totalStudents: z.number(),
          totalTeachers: z.number(),
          monthlyRevenue: z.number(),
          todayAttendance: z.number(),
          revenueTrend: z.array(z.any()),
          attendanceTrend: z.array(z.any()),
        }) 
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
