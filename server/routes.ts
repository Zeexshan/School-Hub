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
  _httpServer: Server,
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
    "/api/sections",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const { classId } = req.query;
        if (classId) {
          const sections = await storage.getSectionsByClass(classId as string);
          return res.json(sections);
        }
        return res.json([]);
      } catch (error) {
        console.error("Get sections error:", error);
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
    "/api/students/me",
    authenticateToken,
    requireRole("student"),
    async (req: AuthRequest, res: Response) => {
      try {
        const student = await storage.getStudentByUserId(req.user!.id);
        if (!student) {
          return res.status(404).json({ message: "Student record not found" });
        }
        return res.json(student);
      } catch (error) {
        console.error("Get my student error:", error);
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

  app.get(
    "/api/analytics/dashboard",
    authenticateToken,
    requireRole("admin"),
    async (_req: Request, res: Response) => {
      try {
        const students = await storage.getAllStudents();
        const teachers = await storage.getUsersByRole("teacher");
        const monthlyRevenue = await storage.getMonthlyRevenue();
        const todayAttendance = await storage.getTodayAttendancePercentage();

        // Add trend data for the dashboard charts
        const revenueTrend = [
          { month: "Jan", amount: monthlyRevenue },
          { month: "Feb", amount: 0 },
          { month: "Mar", amount: 0 },
        ];

        const attendanceTrend = [
          { day: "Mon", present: todayAttendance },
          { day: "Tue", present: 0 },
          { day: "Wed", present: 0 },
          { day: "Thu", present: 0 },
          { day: "Fri", present: 0 },
        ];

        return res.json({
          totalStudents: students.length,
          totalTeachers: teachers.length,
          monthlyRevenue,
          todayAttendance,
          revenueTrend,
          attendanceTrend,
        });
      } catch (error) {
        console.error("Dashboard analytics error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
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
    },
  );

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
        const {
          name,
          email,
          username,
          password,
          salary,
          subjectSpecialization,
          panNumber,
          aadhaarNumber,
          qualification,
          joinDate,
          designation,
          employeeId,
        } = req.body;

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

        const profileResult = insertTeacherProfileSchema.safeParse({
          userId: "placeholder",
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

        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail) {
          return res.status(409).json({ message: "Email already in use" });
        }

        const existingUsername = await storage.getUserByUsername(username);
        if (existingUsername) {
          return res.status(409).json({ message: "Username already in use" });
        }

        const user = await storage.createUser(userResult.data);
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

        const existing = await storage.getTimetableByTeacherPeriod(
          result.data.teacherId,
          result.data.dayOfWeek,
          result.data.periodNumber,
        );

        if (existing) {
          return res
            .status(400)
            .json({ message: "Teacher is already busy during this period." });
        }

        const timetable = await storage.createTimetable(result.data);
        return res.status(201).json(timetable);
      } catch (error) {
        console.error("Create timetable error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/timetable/teacher/:teacherId",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const timetable = await storage.getTimetableByTeacher(
          req.params.teacherId,
        );
        return res.json(timetable);
      } catch (error) {
        console.error("Get teacher timetable error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/timetable/class/:classId",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const timetable = await storage.getTimetableByClass(req.params.classId);
        return res.json(timetable);
      } catch (error) {
        console.error("Get class timetable error:", error);
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
    "/api/fees/student/:studentId",
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

  app.get(
    "/api/timetable/substitutes",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const { dayOfWeek, periodNumber, teacherId, subject } = req.query;
        if (!dayOfWeek || !periodNumber || !teacherId) {
          return res.status(400).json({ message: "Missing required parameters" });
        }
        const substitutes = await storage.getSubstituteTeachers(
          Number(dayOfWeek),
          Number(periodNumber),
          teacherId as string,
          subject as string
        );
        return res.json(substitutes);
      } catch (error) {
        console.error("Get substitutes error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
