import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import {
  type User,
  type InsertUser,
  type Class,
  type InsertClass,
  type Section,
  type InsertSection,
  type Student,
  type InsertStudent,
  type Attendance,
  type InsertAttendance,
  type Assignment,
  type InsertAssignment,
  type Submission,
  type InsertSubmission,
  type Fee,
  type InsertFee,
  type TeacherProfile,
  type InsertTeacherProfile,
  type Timetable,
  type InsertTimetable,
} from "@shared/schema";

// --- DOCUMENTS ---
interface UserDocument extends Document {
  username: string;
  password: string;
  role: string;
  name: string;
  email: string;
  contact?: string;
  profilePicture?: string;
  createdAt: Date;
}

interface ClassDocument extends Document {
  name: string;
  subjects: string[];
}

interface SectionDocument extends Document {
  name: string;
  classId: string;
  roomNumber?: string;
  classTeacherId?: string;
}

interface StudentDocument extends Document {
  userId: string;
  admissionNumber: string;
  rollNumber: string;
  classId: string;
  sectionId: string;
  guardianName: string;
  guardianContact: string;
  guardianEmail?: string;
}

interface AttendanceDocument extends Document {
  date: string;
  studentId: string;
  classId: string;
  sectionId: string;
  status: string;
}

interface AssignmentDocument extends Document {
  title: string;
  description: string;
  classId: string;
  sectionId?: string;
  subject: string;
  deadline: string;
  teacherId: string;
}

interface SubmissionDocument extends Document {
  assignmentId: string;
  studentId: string;
  link: string;
  submittedAt: Date;
  grade?: string;
  feedback?: string;
  gradedAt?: Date;
}

interface FeeDocument extends Document {
  studentId: string;
  amount: number;
  period: string;
  dueDate: string;
  status: string;
  paidDate?: Date;
}

interface TeacherProfileDocument extends Document {
  userId: string;
  salary: number;
  panNumber: string;
  aadhaarNumber: string;
  qualification: string;
  subjectSpecialization: string[];
  joinDate: string;
  designation: string;
  employeeId: string;
  salaryHistory: any[];
}

interface TimetableDocument extends Document {
  classId: string;
  sectionId: string;
  teacherId: string;
  subject: string;
  dayOfWeek: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
}

// --- SCHEMAS ---
const UserSchema = new Schema<UserDocument>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ["admin", "teacher", "student", "parent"],
  },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contact: { type: String },
  profilePicture: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const ClassSchema = new Schema<ClassDocument>({
  name: { type: String, required: true },
  subjects: [{ type: String, required: true }],
});

const SectionSchema = new Schema<SectionDocument>({
  name: { type: String, required: true },
  classId: { type: String, required: true },
  roomNumber: { type: String },
  classTeacherId: { type: String },
});

const StudentSchema = new Schema<StudentDocument>({
  userId: { type: String, required: true },
  admissionNumber: { type: String, required: true, unique: true },
  rollNumber: { type: String, required: true },
  classId: { type: String, required: true },
  sectionId: { type: String, required: true },
  guardianName: { type: String, required: true },
  guardianContact: { type: String, required: true },
  guardianEmail: { type: String },
});

const AttendanceSchema = new Schema<AttendanceDocument>({
  date: { type: String, required: true },
  studentId: { type: String, required: true },
  classId: { type: String, required: true },
  sectionId: { type: String, required: true },
  status: { type: String, required: true, enum: ["Present", "Absent", "Late"] },
});

const AssignmentSchema = new Schema<AssignmentDocument>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  classId: { type: String, required: true },
  sectionId: { type: String },
  subject: { type: String, required: true },
  deadline: { type: String, required: true },
  teacherId: { type: String, required: true },
});

const SubmissionSchema = new Schema<SubmissionDocument>({
  assignmentId: { type: String, required: true },
  studentId: { type: String, required: true },
  link: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  grade: { type: String },
  feedback: { type: String },
  gradedAt: { type: Date },
});

const FeeSchema = new Schema<FeeDocument>({
  studentId: { type: String, required: true },
  amount: { type: Number, required: true },
  period: { type: String, required: true },
  dueDate: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ["Pending", "Cleared"],
    default: "Pending",
  },
  paidDate: { type: Date },
});

const TeacherProfileSchema = new Schema<TeacherProfileDocument>({
  userId: { type: String, required: true, unique: true },
  salary: { type: Number, required: true },
  panNumber: { type: String, required: true },
  aadhaarNumber: { type: String, required: true },
  qualification: { type: String, required: true },
  subjectSpecialization: [{ type: String, required: true }],
  joinDate: { type: String, required: true },
  designation: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  salaryHistory: { type: [Schema.Types.Mixed], default: [] },
});

const TimetableSchema = new Schema<TimetableDocument>({
  classId: { type: String, required: true },
  sectionId: { type: String, required: true },
  teacherId: { type: String, required: true },
  subject: { type: String, required: true },
  dayOfWeek: { type: Number, required: true, min: 1, max: 6 },
  periodNumber: { type: Number, required: true, min: 1, max: 8 },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
});

// Indices
TimetableSchema.index(
  { classId: 1, sectionId: 1, dayOfWeek: 1, periodNumber: 1 },
  { unique: true },
);
TimetableSchema.index(
  { teacherId: 1, dayOfWeek: 1, periodNumber: 1 },
  { unique: true },
);
AttendanceSchema.index({ date: 1, classId: 1, sectionId: 1 });
AttendanceSchema.index({ studentId: 1, date: 1 });

// --- MODELS ---
const UserModel = mongoose.model<UserDocument>("User", UserSchema);
const ClassModel = mongoose.model<ClassDocument>("Class", ClassSchema);
const SectionModel = mongoose.model<SectionDocument>("Section", SectionSchema);
const StudentModel = mongoose.model<StudentDocument>("Student", StudentSchema);
const AttendanceModel = mongoose.model<AttendanceDocument>(
  "Attendance",
  AttendanceSchema,
);
const AssignmentModel = mongoose.model<AssignmentDocument>(
  "Assignment",
  AssignmentSchema,
);
const SubmissionModel = mongoose.model<SubmissionDocument>(
  "Submission",
  SubmissionSchema,
);
const FeeModel = mongoose.model<FeeDocument>("Fee", FeeSchema);
const TeacherProfileModel = mongoose.model<TeacherProfileDocument>(
  "TeacherProfile",
  TeacherProfileSchema,
);
const TimetableModel = mongoose.model<TimetableDocument>(
  "Timetable",
  TimetableSchema,
);

// --- CONVERTERS ---
function docToUser(doc: UserDocument): User {
  return {
    id: doc._id.toString(),
    username: doc.username,
    password: doc.password,
    role: doc.role as User["role"],
    name: doc.name,
    email: doc.email,
    contact: doc.contact,
    profilePicture: doc.profilePicture,
    createdAt: doc.createdAt,
  };
}

function docToClass(doc: ClassDocument): Class {
  return { id: doc._id.toString(), name: doc.name, subjects: doc.subjects };
}

function docToSection(doc: SectionDocument): Section {
  return {
    id: doc._id.toString(),
    name: doc.name,
    classId: doc.classId,
    roomNumber: doc.roomNumber,
    classTeacherId: doc.classTeacherId,
  };
}

function docToStudent(doc: StudentDocument): Student {
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    admissionNumber: doc.admissionNumber,
    rollNumber: doc.rollNumber,
    classId: doc.classId,
    sectionId: doc.sectionId,
    guardianName: doc.guardianName,
    guardianContact: doc.guardianContact,
    guardianEmail: doc.guardianEmail,
  };
}

function docToAttendance(doc: AttendanceDocument): Attendance {
  return {
    id: doc._id.toString(),
    date: doc.date,
    studentId: doc.studentId,
    classId: doc.classId,
    sectionId: doc.sectionId,
    status: doc.status as Attendance["status"],
  };
}

function docToAssignment(doc: AssignmentDocument): Assignment {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    classId: doc.classId,
    sectionId: doc.sectionId,
    subject: doc.subject,
    deadline: doc.deadline,
    teacherId: doc.teacherId,
  };
}

function docToSubmission(doc: SubmissionDocument): Submission {
  return {
    id: doc._id.toString(),
    assignmentId: doc.assignmentId,
    studentId: doc.studentId,
    link: doc.link,
    submittedAt: doc.submittedAt,
    grade: doc.grade,
    feedback: doc.feedback,
    gradedAt: doc.gradedAt,
  };
}

function docToFee(doc: FeeDocument): Fee {
  return {
    id: doc._id.toString(),
    studentId: doc.studentId,
    amount: doc.amount,
    period: doc.period,
    dueDate: doc.dueDate,
    status: doc.status as Fee["status"],
    paidDate: doc.paidDate,
  };
}

function docToTeacherProfile(doc: TeacherProfileDocument): TeacherProfile {
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    salary: doc.salary,
    panNumber: doc.panNumber,
    aadhaarNumber: doc.aadhaarNumber,
    qualification: doc.qualification,
    subjectSpecialization: doc.subjectSpecialization,
    joinDate: doc.joinDate,
    designation: doc.designation,
    employeeId: doc.employeeId,
    salaryHistory: doc.salaryHistory || [],
  };
}

function docToTimetable(doc: TimetableDocument): Timetable {
  return {
    id: doc._id.toString(),
    classId: doc.classId,
    sectionId: doc.sectionId,
    teacherId: doc.teacherId,
    subject: doc.subject,
    dayOfWeek: doc.dayOfWeek,
    periodNumber: doc.periodNumber,
    startTime: doc.startTime,
    endTime: doc.endTime,
  };
}

// --- INTERFACE ---
export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  createClass(classData: InsertClass): Promise<Class>;
  getClass(id: string): Promise<Class | undefined>;
  getAllClasses(): Promise<Class[]>;
  updateClass(
    id: string,
    classData: Partial<InsertClass>,
  ): Promise<Class | undefined>;
  deleteClass(id: string): Promise<boolean>;
  createSection(sectionData: InsertSection): Promise<Section>;
  getSection(id: string): Promise<Section | undefined>;
  getSectionsByClass(classId: string): Promise<Section[]>;
  updateSection(
    id: string,
    sectionData: Partial<InsertSection>,
  ): Promise<Section | undefined>;
  deleteSection(id: string): Promise<boolean>;
  createStudent(studentData: InsertStudent): Promise<Student>;
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByUserId(userId: string): Promise<Student | undefined>;
  getStudentsBySection(classId: string, sectionId: string): Promise<Student[]>;
  getAllStudents(): Promise<Student[]>;
  updateStudent(
    id: string,
    studentData: Partial<InsertStudent>,
  ): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<boolean>;
  createAttendance(attendanceData: InsertAttendance): Promise<Attendance>;
  getAttendanceByDateAndSection(
    date: string,
    classId: string,
    sectionId: string,
  ): Promise<Attendance[]>;
  getAttendanceByStudent(
    studentId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Attendance[]>;
  updateAttendance(id: string, status: string): Promise<Attendance | undefined>;
  createAssignment(assignmentData: InsertAssignment): Promise<Assignment>;
  getAssignment(id: string): Promise<Assignment | undefined>;
  getAssignmentsByClass(
    classId: string,
    sectionId?: string,
  ): Promise<Assignment[]>;
  getAssignmentsByTeacher(teacherId: string): Promise<Assignment[]>;
  updateAssignment(
    id: string,
    data: Partial<InsertAssignment>,
  ): Promise<Assignment | undefined>;
  deleteAssignment(id: string): Promise<boolean>;
  createSubmission(submissionData: InsertSubmission): Promise<Submission>;
  getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]>;
  getSubmissionsByStudent(studentId: string): Promise<Submission[]>;
  gradeSubmission(
    id: string,
    grade: string,
    feedback?: string,
  ): Promise<Submission | undefined>;
  createFee(feeData: InsertFee): Promise<Fee>;
  getFeesByStudent(studentId: string): Promise<Fee[]>;
  updateFeeStatus(
    id: string,
    status: string,
    paidDate?: Date,
  ): Promise<Fee | undefined>;
  getAllFees(): Promise<Fee[]>;
  createTeacherProfile(
    profileData: InsertTeacherProfile,
  ): Promise<TeacherProfile>;
  getTeacherProfileByUserId(
    userId: string,
  ): Promise<TeacherProfile | undefined>;
  updateTeacherProfile(
    userId: string,
    data: Partial<InsertTeacherProfile>,
  ): Promise<TeacherProfile | undefined>;
  getAllTeacherProfiles(): Promise<TeacherProfile[]>;
  paySalary(
    userId: string,
    month: string,
    amount: number,
  ): Promise<TeacherProfile | undefined>;
  getMonthlyRevenue(): Promise<number>;
  getTodayAttendancePercentage(): Promise<number>;
  getTimetableByTeacherPeriod(
    teacherId: string,
    dayOfWeek: number,
    periodNumber: number,
  ): Promise<Timetable | undefined>;
  createTimetable(timetableData: InsertTimetable): Promise<Timetable>;
  getTimetableByClass(classId: string, sectionId?: string): Promise<Timetable[]>;
  getTimetableByTeacher(teacherId: string): Promise<Timetable[]>;
  deleteTimetable(id: string): Promise<boolean>;
  getSubstituteTeachers(
    dayOfWeek: number,
    periodNumber: number,
    excludedTeacherId: string,
    subject?: string,
  ): Promise<User[]>;
}

// --- IMPLEMENTATION ---
export class MongoStorage implements IStorage {
  async getMonthlyRevenue(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const fees = await FeeModel.find({
      status: "Cleared",
      paidDate: { $gte: startOfMonth },
    });
    return fees.reduce((sum, fee) => sum + fee.amount, 0);
  }

  async getTodayAttendancePercentage(): Promise<number> {
    const today = new Date().toISOString().split("T")[0];
    const students = await StudentModel.find();
    if (students.length === 0) return 0;
    
    const presentCount = await AttendanceModel.countDocuments({
      date: today,
      status: "Present",
    });
    return Math.round((presentCount / students.length) * 100);
  }

  async getTimetableByTeacherPeriod(
    teacherId: string,
    dayOfWeek: number,
    periodNumber: number,
  ): Promise<Timetable | undefined> {
    const doc = await TimetableModel.findOne({
      teacherId,
      dayOfWeek,
      periodNumber,
    });
    return doc ? docToTimetable(doc) : undefined;
  }

  async getTimetableByTeacher(teacherId: string): Promise<Timetable[]> {
    const docs = await TimetableModel.find({ teacherId }).sort({ dayOfWeek: 1, periodNumber: 1 });
    return docs.map(docToTimetable);
  }

  async getTimetableByClass(classId: string, sectionId?: string): Promise<Timetable[]> {
    const query: any = { classId };
    if (sectionId) query.sectionId = sectionId;
    const docs = await TimetableModel.find(query).sort({ dayOfWeek: 1, periodNumber: 1 });
    return docs.map(docToTimetable);
  }

  async createTimetable(timetableData: InsertTimetable): Promise<Timetable> {
    const doc = await TimetableModel.create(timetableData);
    return docToTimetable(doc);
  }

  async deleteTimetable(id: string): Promise<boolean> {
    const result = await TimetableModel.findByIdAndDelete(id);
    return !!result;
  }

  async getSubstituteTeachers(
    dayOfWeek: number,
    periodNumber: number,
    excludedTeacherId: string,
    subject?: string,
  ): Promise<User[]> {
    // 1. Get all teacher users
    const teachers = await UserModel.find({ role: "teacher" });
    
    // 2. Find teachers who are ALREADY assigned during this slot
    const busyTimetables = await TimetableModel.find({
      dayOfWeek,
      periodNumber
    });
    const busyTeacherIds = new Set(busyTimetables.map(t => t.teacherId));
    
    // 3. Find teachers who are ABSENT today
    const today = new Date().toISOString().split("T")[0];
    const absentAttendance = await AttendanceModel.find({
      date: today,
      status: "Absent"
    });
    // This assumes teachers have student records or a separate attendance system. 
    // In this app, attendance is for students. Let's assume we check teacher attendance separately if it existed.
    // For now, we'll just check if they are busy in the timetable.
    
    // 4. Filter teachers
    const availableTeachers = teachers.filter(t => 
      t.id.toString() !== excludedTeacherId && 
      !busyTeacherIds.has(t.id.toString())
    );

    return availableTeachers.map(docToUser);
  }

  async getUser(id: string): Promise<User | undefined> {
    const doc = await UserModel.findById(id);
    return doc ? docToUser(doc) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const doc = await UserModel.findOne({ username });
    return doc ? docToUser(doc) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const doc = await UserModel.findOne({ email });
    return doc ? docToUser(doc) : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const doc = await UserModel.create({ ...user, password: hashedPassword });
    return docToUser(doc);
  }

  async getAllUsers(): Promise<User[]> {
    const docs = await UserModel.find();
    return docs.map(docToUser);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const docs = await UserModel.find({ role });
    return docs.map(docToUser);
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const doc = await ClassModel.create(classData);
    return docToClass(doc);
  }

  async getClass(id: string): Promise<Class | undefined> {
    const doc = await ClassModel.findById(id);
    return doc ? docToClass(doc) : undefined;
  }

  async getAllClasses(): Promise<Class[]> {
    const docs = await ClassModel.find();
    return docs.map(docToClass);
  }

  async updateClass(
    id: string,
    classData: Partial<InsertClass>,
  ): Promise<Class | undefined> {
    const doc = await ClassModel.findByIdAndUpdate(id, classData, {
      new: true,
    });
    return doc ? docToClass(doc) : undefined;
  }

  async deleteClass(id: string): Promise<boolean> {
    const result = await ClassModel.findByIdAndDelete(id);
    return !!result;
  }

  async createSection(sectionData: InsertSection): Promise<Section> {
    const doc = await SectionModel.create(sectionData);
    return docToSection(doc);
  }

  async getSection(id: string): Promise<Section | undefined> {
    const doc = await SectionModel.findById(id);
    return doc ? docToSection(doc) : undefined;
  }

  async getSectionsByClass(classId: string): Promise<Section[]> {
    const docs = await SectionModel.find({ classId });
    return docs.map(docToSection);
  }

  async updateSection(
    id: string,
    sectionData: Partial<InsertSection>,
  ): Promise<Section | undefined> {
    const doc = await SectionModel.findByIdAndUpdate(id, sectionData, {
      new: true,
    });
    return doc ? docToSection(doc) : undefined;
  }

  async deleteSection(id: string): Promise<boolean> {
    const result = await SectionModel.findByIdAndDelete(id);
    return !!result;
  }

  async createStudent(studentData: InsertStudent): Promise<Student> {
    const doc = await StudentModel.create(studentData);
    return docToStudent(doc);
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const doc = await StudentModel.findById(id);
    return doc ? docToStudent(doc) : undefined;
  }

  async getStudentByUserId(userId: string): Promise<Student | undefined> {
    const doc = await StudentModel.findOne({ userId });
    return doc ? docToStudent(doc) : undefined;
  }

  async getStudentsBySection(
    classId: string,
    sectionId: string,
  ): Promise<Student[]> {
    const docs = await StudentModel.find({ classId, sectionId });
    return docs.map(docToStudent);
  }

  async getAllStudents(): Promise<Student[]> {
    const docs = await StudentModel.find();
    return docs.map(docToStudent);
  }

  async updateStudent(
    id: string,
    studentData: Partial<InsertStudent>,
  ): Promise<Student | undefined> {
    const doc = await StudentModel.findByIdAndUpdate(id, studentData, {
      new: true,
    });
    return doc ? docToStudent(doc) : undefined;
  }

  async deleteStudent(id: string): Promise<boolean> {
    const result = await StudentModel.findByIdAndDelete(id);
    return !!result;
  }

  async createAttendance(
    attendanceData: InsertAttendance,
  ): Promise<Attendance> {
    const doc = await AttendanceModel.create(attendanceData);
    return docToAttendance(doc);
  }

  async getAttendanceByDateAndSection(
    date: string,
    classId: string,
    sectionId: string,
  ): Promise<Attendance[]> {
    const docs = await AttendanceModel.find({ date, classId, sectionId });
    return docs.map(docToAttendance);
  }

  async getAttendanceByStudent(
    studentId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Attendance[]> {
    const query: any = { studentId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }
    const docs = await AttendanceModel.find(query).sort({ date: -1 });
    return docs.map(docToAttendance);
  }

  async updateAttendance(
    id: string,
    status: string,
  ): Promise<Attendance | undefined> {
    const doc = await AttendanceModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
    return doc ? docToAttendance(doc) : undefined;
  }

  async createAssignment(
    assignmentData: InsertAssignment,
  ): Promise<Assignment> {
    const doc = await AssignmentModel.create(assignmentData);
    return docToAssignment(doc);
  }

  async getAssignment(id: string): Promise<Assignment | undefined> {
    const doc = await AssignmentModel.findById(id);
    return doc ? docToAssignment(doc) : undefined;
  }

  async getAssignmentsByClass(
    classId: string,
    sectionId?: string,
  ): Promise<Assignment[]> {
    const query: any = { classId };
    if (sectionId)
      query.$or = [{ sectionId }, { sectionId: { $exists: false } }];
    const docs = await AssignmentModel.find(query).sort({ deadline: 1 });
    return docs.map(docToAssignment);
  }

  async getAssignmentsByTeacher(teacherId: string): Promise<Assignment[]> {
    const docs = await AssignmentModel.find({ teacherId }).sort({
      deadline: 1,
    });
    return docs.map(docToAssignment);
  }

  async updateAssignment(
    id: string,
    data: Partial<InsertAssignment>,
  ): Promise<Assignment | undefined> {
    const doc = await AssignmentModel.findByIdAndUpdate(id, data, {
      new: true,
    });
    return doc ? docToAssignment(doc) : undefined;
  }

  async deleteAssignment(id: string): Promise<boolean> {
    const result = await AssignmentModel.findByIdAndDelete(id);
    return !!result;
  }

  async createSubmission(
    submissionData: InsertSubmission,
  ): Promise<Submission> {
    const doc = await SubmissionModel.create(submissionData);
    return docToSubmission(doc);
  }

  async getSubmissionsByAssignment(
    assignmentId: string,
  ): Promise<Submission[]> {
    const docs = await SubmissionModel.find({ assignmentId });
    return docs.map(docToSubmission);
  }

  async getSubmissionsByStudent(studentId: string): Promise<Submission[]> {
    const docs = await SubmissionModel.find({ studentId });
    return docs.map(docToSubmission);
  }

  async gradeSubmission(
    id: string,
    grade: string,
    feedback?: string,
  ): Promise<Submission | undefined> {
    const update: any = { grade, gradedAt: new Date() };
    if (feedback) update.feedback = feedback;
    const doc = await SubmissionModel.findByIdAndUpdate(id, update, {
      new: true,
    });
    return doc ? docToSubmission(doc) : undefined;
  }

  async createFee(feeData: InsertFee): Promise<Fee> {
    const doc = await FeeModel.create(feeData);
    return docToFee(doc);
  }

  async getFeesByStudent(studentId: string): Promise<Fee[]> {
    const docs = await FeeModel.find({ studentId });
    return docs.map(docToFee);
  }

  async updateFeeStatus(
    id: string,
    status: string,
    paidDate?: Date,
  ): Promise<Fee | undefined> {
    const update: any = { status };
    if (paidDate) update.paidDate = paidDate;
    const doc = await FeeModel.findByIdAndUpdate(id, update, { new: true });
    return doc ? docToFee(doc) : undefined;
  }

  async getAllFees(): Promise<Fee[]> {
    const docs = await FeeModel.find();
    return docs.map(docToFee);
  }

  async createTeacherProfile(
    profileData: InsertTeacherProfile,
  ): Promise<TeacherProfile> {
    const doc = await TeacherProfileModel.create(profileData);
    return docToTeacherProfile(doc);
  }

  async getTeacherProfileByUserId(
    userId: string,
  ): Promise<TeacherProfile | undefined> {
    const doc = await TeacherProfileModel.findOne({ userId });
    return doc ? docToTeacherProfile(doc) : undefined;
  }

  async updateTeacherProfile(
    userId: string,
    data: Partial<InsertTeacherProfile>,
  ): Promise<TeacherProfile | undefined> {
    const doc = await TeacherProfileModel.findOneAndUpdate({ userId }, data, {
      new: true,
    });
    return doc ? docToTeacherProfile(doc) : undefined;
  }

  async getAllTeacherProfiles(): Promise<TeacherProfile[]> {
    const docs = await TeacherProfileModel.find();
    return docs.map(docToTeacherProfile);
  }

  async paySalary(
    userId: string,
    month: string,
    amount: number,
  ): Promise<TeacherProfile | undefined> {
    const doc = await TeacherProfileModel.findOneAndUpdate(
      { userId },
      {
        $push: {
          salaryHistory: { month, amount, paidDate: new Date() },
        },
      },
      { new: true },
    );
    return doc ? docToTeacherProfile(doc) : undefined;
  }
}

export const storage = new MongoStorage();
