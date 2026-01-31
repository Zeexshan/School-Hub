import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import {
  insertUserSchema,
  loginSchema,
  insertClassSchema,
  insertSectionSchema,
  insertStudentSchema,
  insertAttendanceSchema,
  bulkAttendanceSchema,
  insertAssignmentSchema,
  insertSubmissionSchema,
  gradeSubmissionSchema,
  insertFeeSchema,
  insertTeacherProfileSchema,
  insertTimetableSchema,
} from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;

if (!JWT_SECRET) {
  console.error(
    "JWT_SECRET or SESSION_SECRET environment variable is not set.",
  );
  console.error("Please add a secret key to the Secrets tab.");
  process.exit(1);
}

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET!, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = decoded as AuthRequest["user"];
    next();
  });
}

function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .json({
            message: "Validation failed",
            errors: result.error.flatten(),
          });
      }

      const existingUser = await storage.getUserByEmail(result.data.email);
      if (existingUser) {
        return res.status(409).json({ message: "Email already in use" });
      }

      const existingUsername = await storage.getUserByUsername(
        result.data.username,
      );
      if (existingUsername) {
        return res.status(409).json({ message: "Username already in use" });
      }

      const user = await storage.createUser(result.data);
      const { password, ...userWithoutPassword } = user;

      const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        JWT_SECRET!,
        { expiresIn: "7d" },
      );

      return res.status(201).json({ token, user: userWithoutPassword });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .json({
            message: "Validation failed",
            errors: result.error.flatten(),
          });
      }

      const user = await storage.getUserByUsername(result.data.username);
      if (!user) {
        return res
          .status(401)
          .json({ message: "Invalid username or password" });
      }

      const validPassword = await bcrypt.compare(
        result.data.password,
        user.password,
      );
      if (!validPassword) {
        return res
          .status(401)
          .json({ message: "Invalid username or password" });
      }

      const { password, ...userWithoutPassword } = user;

      const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        JWT_SECRET!,
        { expiresIn: "7d" },
      );

      return res.json({ token, user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(
    "/api/auth/me",
    authenticateToken,
    async (req: AuthRequest, res: Response) => {
      try {
        const user = await storage.getUser(req.user!.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      } catch (error) {
        console.error("Get user error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/users",
    authenticateToken,
    requireRole("admin"),
    async (_req: Request, res: Response) => {
      try {
        const users = await storage.getAllUsers();
        const usersWithoutPasswords = users.map(
          ({ password, ...user }) => user,
        );
        return res.json(usersWithoutPasswords);
      } catch (error) {
        console.error("Get users error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/users/role/:role",
    authenticateToken,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      try {
        const users = await storage.getUsersByRole(req.params.role);
        const usersWithoutPasswords = users.map(
          ({ password, ...user }) => user,
        );
        return res.json(usersWithoutPasswords);
      } catch (error) {
        console.error("Get users by role error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/classes",
    authenticateToken,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      try {
        const result = insertClassSchema.safeParse(req.body);
        if (!result.success) {
          return res
            .status(400)
            .json({
              message: "Validation failed",
              errors: result.error.flatten(),
            });
        }
        const newClass = await storage.createClass(result.data);
        return res.status(201).json(newClass);
      } catch (error) {
        console.error("Create class error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/classes",
    authenticateToken,
    async (_req: Request, res: Response) => {
      try {
        const classes = await storage.getAllClasses();
        return res.json(classes);
      } catch (error) {
        console.error("Get classes error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/classes/:id",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const classData = await storage.getClass(req.params.id);
        if (!classData) {
          return res.status(404).json({ message: "Class not found" });
        }
        return res.json(classData);
      } catch (error) {
        console.error("Get class error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.patch(
    "/api/classes/:id",
    authenticateToken,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      try {
        const updated = await storage.updateClass(req.params.id, req.body);
        if (!updated) {
          return res.status(404).json({ message: "Class not found" });
        }
        return res.json(updated);
      } catch (error) {
        console.error("Update class error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.delete(
    "/api/classes/:id",
    authenticateToken,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      try {
        const deleted = await storage.deleteClass(req.params.id);
        if (!deleted) {
          return res.status(404).json({ message: "Class not found" });
        }
        return res.status(204).send();
      } catch (error) {
        console.error("Delete class error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/sections",
    authenticateToken,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      try {
        const result = insertSectionSchema.safeParse(req.body);
        if (!result.success) {
          return res
            .status(400)
            .json({
              message: "Validation failed",
              errors: result.error.flatten(),
            });
        }
        const section = await storage.createSection(result.data);
        return res.status(201).json(section);
      } catch (error) {
        console.error("Create section error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/classes/:classId/sections",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const sections = await storage.getSectionsByClass(req.params.classId);
        return res.json(sections);
      } catch (error) {
        console.error("Get sections error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.patch(
    "/api/sections/:id",
    authenticateToken,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      try {
        const updated = await storage.updateSection(req.params.id, req.body);
        if (!updated) {
          return res.status(404).json({ message: "Section not found" });
        }
        return res.json(updated);
      } catch (error) {
        console.error("Update section error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.delete(
    "/api/sections/:id",
    authenticateToken,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      try {
        const deleted = await storage.deleteSection(req.params.id);
        if (!deleted) {
          return res.status(404).json({ message: "Section not found" });
        }
        return res.status(204).send();
      } catch (error) {
        console.error("Delete section error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/students",
    authenticateToken,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      try {
        const result = insertStudentSchema.safeParse(req.body);
        if (!result.success) {
          return res
            .status(400)
            .json({
              message: "Validation failed",
              errors: result.error.flatten(),
            });
        }
        const student = await storage.createStudent(result.data);
        return res.status(201).json(student);
      } catch (error) {
        console.error("Create student error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/students",
    authenticateToken,
    async (_req: Request, res: Response) => {
      try {
        const students = await storage.getAllStudents();
        return res.json(students);
      } catch (error) {
        console.error("Get students error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/students/:id",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const student = await storage.getStudent(req.params.id);
        if (!student) {
          return res.status(404).json({ message: "Student not found" });
        }
        return res.json(student);
      } catch (error) {
        console.error("Get student error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/sections/:sectionId/students",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const { classId } = req.query;
        if (!classId || typeof classId !== "string") {
          return res
            .status(400)
            .json({ message: "classId query parameter required" });
        }
        const students = await storage.getStudentsBySection(
          classId,
          req.params.sectionId,
        );
        return res.json(students);
      } catch (error) {
        console.error("Get students by section error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.patch(
    "/api/students/:id",
    authenticateToken,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      try {
        const updated = await storage.updateStudent(req.params.id, req.body);
        if (!updated) {
          return res.status(404).json({ message: "Student not found" });
        }
        return res.json(updated);
      } catch (error) {
        console.error("Update student error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.delete(
    "/api/students/:id",
    authenticateToken,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      try {
        const deleted = await storage.deleteStudent(req.params.id);
        if (!deleted) {
          return res.status(404).json({ message: "Student not found" });
        }
        return res.status(204).send();
      } catch (error) {
        console.error("Delete student error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/attendance",
    authenticateToken,
    requireRole("admin", "teacher"),
    async (req: Request, res: Response) => {
      try {
        const result = insertAttendanceSchema.safeParse(req.body);
        if (!result.success) {
          return res
            .status(400)
            .json({
              message: "Validation failed",
              errors: result.error.flatten(),
            });
        }
        const attendance = await storage.createAttendance(result.data);
        return res.status(201).json(attendance);
      } catch (error) {
        console.error("Create attendance error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/attendance/bulk",
    authenticateToken,
    requireRole("admin", "teacher"),
    async (req: Request, res: Response) => {
      try {
        const result = bulkAttendanceSchema.safeParse(req.body);
        if (!result.success) {
          return res
            .status(400)
            .json({
              message: "Validation failed",
              errors: result.error.flatten(),
            });
        }

        const { date, classId, sectionId, records } = result.data;
        const attendanceRecords = await Promise.all(
          records.map((record) =>
            storage.createAttendance({
              date,
              classId,
              sectionId,
              studentId: record.studentId,
              status: record.status,
            }),
          ),
        );

        return res.status(201).json(attendanceRecords);
      } catch (error) {
        console.error("Bulk attendance error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/attendance",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const { date, classId, sectionId } = req.query;
        if (!date || !classId || !sectionId) {
          return res
            .status(400)
            .json({
              message: "date, classId, and sectionId query parameters required",
            });
        }
        const attendance = await storage.getAttendanceByDateAndSection(
          date as string,
          classId as string,
          sectionId as string,
        );
        return res.json(attendance);
      } catch (error) {
        console.error("Get attendance error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/students/:studentId/attendance",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const { startDate, endDate } = req.query;
        const attendance = await storage.getAttendanceByStudent(
          req.params.studentId,
          startDate as string | undefined,
          endDate as string | undefined,
        );
        return res.json(attendance);
      } catch (error) {
        console.error("Get student attendance error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/assignments",
    authenticateToken,
    requireRole("admin", "teacher"),
    async (req: Request, res: Response) => {
      try {
        const result = insertAssignmentSchema.safeParse(req.body);
        if (!result.success) {
          return res
            .status(400)
            .json({
              message: "Validation failed",
              errors: result.error.flatten(),
            });
        }
        const assignment = await storage.createAssignment(result.data);
        return res.status(201).json(assignment);
      } catch (error) {
        console.error("Create assignment error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/assignments",
    authenticateToken,
    async (req: AuthRequest, res: Response) => {
      try {
        const { classId, sectionId, teacherId } = req.query;

        if (teacherId) {
          const assignments = await storage.getAssignmentsByTeacher(
            teacherId as string,
          );
          return res.json(assignments);
        }

        if (classId) {
          const assignments = await storage.getAssignmentsByClass(
            classId as string,
            sectionId as string | undefined,
          );
          return res.json(assignments);
        }

        return res
          .status(400)
          .json({ message: "classId or teacherId query parameter required" });
      } catch (error) {
        console.error("Get assignments error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/assignments/:id",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const assignment = await storage.getAssignment(req.params.id);
        if (!assignment) {
          return res.status(404).json({ message: "Assignment not found" });
        }
        return res.json(assignment);
      } catch (error) {
        console.error("Get assignment error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.patch(
    "/api/assignments/:id",
    authenticateToken,
    requireRole("admin", "teacher"),
    async (req: Request, res: Response) => {
      try {
        const updated = await storage.updateAssignment(req.params.id, req.body);
        if (!updated) {
          return res.status(404).json({ message: "Assignment not found" });
        }
        return res.json(updated);
      } catch (error) {
        console.error("Update assignment error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.delete(
    "/api/assignments/:id",
    authenticateToken,
    requireRole("admin", "teacher"),
    async (req: Request, res: Response) => {
      try {
        const deleted = await storage.deleteAssignment(req.params.id);
        if (!deleted) {
          return res.status(404).json({ message: "Assignment not found" });
        }
        return res.status(204).send();
      } catch (error) {
        console.error("Delete assignment error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/submissions",
    authenticateToken,
    requireRole("student"),
    async (req: Request, res: Response) => {
      try {
        const result = insertSubmissionSchema.safeParse(req.body);
        if (!result.success) {
          return res
            .status(400)
            .json({
              message: "Validation failed",
              errors: result.error.flatten(),
            });
        }
        const submission = await storage.createSubmission(result.data);
        return res.status(201).json(submission);
      } catch (error) {
        console.error("Create submission error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/assignments/:assignmentId/submissions",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const submissions = await storage.getSubmissionsByAssignment(
          req.params.assignmentId,
        );
        return res.json(submissions);
      } catch (error) {
        console.error("Get submissions error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/students/:studentId/submissions",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const submissions = await storage.getSubmissionsByStudent(
          req.params.studentId,
        );
        return res.json(submissions);
      } catch (error) {
        console.error("Get student submissions error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.patch(
    "/api/submissions/:id/grade",
    authenticateToken,
    requireRole("admin", "teacher"),
    async (req: Request, res: Response) => {
      try {
        const result = gradeSubmissionSchema.safeParse(req.body);
        if (!result.success) {
          return res
            .status(400)
            .json({
              message: "Validation failed",
              errors: result.error.flatten(),
            });
        }
        const graded = await storage.gradeSubmission(
          req.params.id,
          result.data.grade,
          result.data.feedback,
        );
        if (!graded) {
          return res.status(404).json({ message: "Submission not found" });
        }
        return res.json(graded);
      } catch (error) {
        console.error("Grade submission error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/fees",
    authenticateToken,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      try {
        const result = insertFeeSchema.safeParse(req.body);
        if (!result.success) {
          return res
            .status(400)
            .json({
              message: "Validation failed",
              errors: result.error.flatten(),
            });
        }
        const fee = await storage.createFee(result.data);
        return res.status(201).json(fee);
      } catch (error) {
        console.error("Create fee error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/fees",
    authenticateToken,
    requireRole("admin"),
    async (_req: Request, res: Response) => {
      try {
        const fees = await storage.getAllFees();
        return res.json(fees);
      } catch (error) {
        console.error("Get fees error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/students/:studentId/fees",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const fees = await storage.getFeesByStudent(req.params.studentId);
        return res.json(fees);
      } catch (error) {
        console.error("Get student fees error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.patch(
    "/api/fees/:id/pay",
    authenticateToken,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      try {
        const updated = await storage.updateFeeStatus(
          req.params.id,
          "Cleared",
          new Date(),
        );
        if (!updated) {
          return res.status(404).json({ message: "Fee record not found" });
        }
        return res.json(updated);
      } catch (error) {
        console.error("Pay fee error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Analytics endpoint
  app.post(
    "/api/teachers/:id/pay-salary",
    authenticateToken,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      try {
        const { month, amount } = req.body;
        if (!month || !amount) {
          return res.status(400).json({ message: "Month and amount are required" });
        }
        const updated = await storage.paySalary(req.params.id, month, amount);
        if (!updated) {
          return res.status(404).json({ message: "Teacher profile not found" });
        }
        return res.json(updated);
      } catch (error) {
        console.error("Pay salary error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.post(
    "/api/timetable",
    authenticateToken,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      try {
        const result = insertTimetableSchema.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({
            message: "Validation failed",
            errors: result.error.flatten(),
          });
        }
        const timetable = await storage.createTimetable(result.data);
        return res.status(201).json(timetable);
      } catch (error) {
        console.error("Create timetable error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.get(
    "/api/timetable/class/:classId/section/:sectionId",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const timetable = await storage.getTimetableByClass(req.params.classId, req.params.sectionId);
        return res.json(timetable);
      } catch (error) {
        console.error("Get timetable error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.get(
    "/api/timetable/teacher/:teacherId",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const timetable = await storage.getTimetableByTeacher(req.params.teacherId);
        return res.json(timetable);
      } catch (error) {
        console.error("Get teacher timetable error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.delete(
    "/api/timetable/:id",
    authenticateToken,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      try {
        const deleted = await storage.deleteTimetable(req.params.id);
        if (!deleted) {
          return res.status(404).json({ message: "Timetable entry not found" });
        }
        return res.status(204).send();
      } catch (error) {
        console.error("Delete timetable error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }
  );
  app.get(
    "/api/analytics",
    authenticateToken,
    requireRole("admin"),
    async (_req: Request, res: Response) => {
      try {
        const students = await storage.getAllStudents();
        const teachers = await storage.getUsersByRole("teacher");
        const monthlyRevenue = await storage.getMonthlyRevenue();
        const todayAttendance = await storage.getTodayAttendancePercentage();

        return res.json({
          totalStudents: students.length,
          totalTeachers: teachers.length,
          monthlyRevenue,
          todayAttendance,
        });
      } catch (error) {
        console.error("Analytics error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Teacher routes
  app.get(
    "/api/teachers",
    authenticateToken,
    requireRole("admin"),
    async (_req: Request, res: Response) => {
      try {
        const teachers = await storage.getUsersByRole("teacher");
        const profiles = await storage.getAllTeacherProfiles();
        
        const teachersWithProfiles = teachers.map((teacher) => {
          const { password, ...teacherWithoutPassword } = teacher;
          const profile = profiles.find((p) => p.userId === teacher.id);
          return { ...teacherWithoutPassword, profile };
        });
        
        return res.json(teachersWithProfiles);
      } catch (error) {
        console.error("Get teachers error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/teachers",
    authenticateToken,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      try {
        const { name, email, username, password, salary, subjectSpecialization, panNumber, aadhaarNumber, qualification, joinDate, designation, employeeId } = req.body;
        
        // Validate user data
        const userResult = insertUserSchema.safeParse({
          username,
          password,
          name,
          email,
          role: "teacher",
        });
        
        if (!userResult.success) {
          return res.status(400).json({
            message: "Validation failed",
            errors: userResult.error.flatten(),
          });
        }

        // Validate profile data
        const profileResult = insertTeacherProfileSchema.safeParse({
          userId: "placeholder", // Will be replaced after user creation
          salary,
          subjectSpecialization,
          panNumber,
          aadhaarNumber,
          qualification,
          joinDate,
          designation,
          employeeId,
        });

        if (!profileResult.success) {
          return res.status(400).json({
            message: "Profile validation failed",
            errors: profileResult.error.flatten(),
          });
        }

        // Check existing email/username
        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail) {
          return res.status(409).json({ message: "Email already in use" });
        }

        const existingUsername = await storage.getUserByUsername(username);
        if (existingUsername) {
          return res.status(409).json({ message: "Username already in use" });
        }

        // Create user
        const user = await storage.createUser(userResult.data);
        
        // Create teacher profile
        const profile = await storage.createTeacherProfile({
          userId: user.id,
          salary,
          subjectSpecialization,
          panNumber,
          aadhaarNumber,
          qualification,
          joinDate,
          designation,
          employeeId,
        });
        
        const { password: _, ...userWithoutPassword } = user;
        return res.status(201).json({ ...userWithoutPassword, profile });
      } catch (error) {
        console.error("Create teacher error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.patch(
    "/api/teachers/:id",
    authenticateToken,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      try {
        const { salary, subjectSpecialization, qualification, designation } = req.body;
        
        const updated = await storage.updateTeacherProfile(req.params.id, {
          salary,
          subjectSpecialization,
          qualification,
          designation,
        });
        
        if (!updated) {
          return res.status(404).json({ message: "Teacher profile not found" });
        }
        
        return res.json(updated);
      } catch (error) {
        console.error("Update teacher error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  return httpServer;
}
