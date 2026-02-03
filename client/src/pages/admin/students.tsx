import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from "@/hooks/use-students";
import { useClasses, useSections } from "@/hooks/use-classes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@shared/schema";
import { Link } from "wouter";

const studentFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  admissionNumber: z.string().min(1, "Admission number is required"),
  rollNumber: z.string().min(1, "Roll number is required"),
  classId: z.string().min(1, "Class is required"),
  sectionId: z.string().min(1, "Section is required"),
  guardianName: z.string().min(1, "Guardian name is required"),
  guardianContact: z.string().min(1, "Guardian contact is required"),
  guardianEmail: z.string().email().optional().or(z.literal("")),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

const editStudentFormSchema = z.object({
  rollNumber: z.string().min(1, "Roll number is required"),
  classId: z.string().min(1, "Class is required"),
  sectionId: z.string().min(1, "Section is required"),
  guardianName: z.string().min(1, "Guardian name is required"),
  guardianContact: z.string().min(1, "Guardian contact is required"),
  guardianEmail: z.string().email().optional().or(z.literal("")),
});

type EditStudentFormValues = z.infer<typeof editStudentFormSchema>;

export default function StudentsPage() {
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: classes, isLoading: classesLoading } = useClasses();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const { data: sections } = useSections(selectedClassId);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      admissionNumber: "",
      rollNumber: "",
      classId: "",
      sectionId: "",
      guardianName: "",
      guardianContact: "",
      guardianEmail: "",
    },
  });

  const editForm = useForm<EditStudentFormValues>({
    resolver: zodResolver(editStudentFormSchema),
    defaultValues: {
      rollNumber: "",
      classId: "",
      sectionId: "",
      guardianName: "",
      guardianContact: "",
      guardianEmail: "",
    },
  });

  const watchClassId = form.watch("classId");
  const editWatchClassId = editForm.watch("classId");

  useEffect(() => {
    if (watchClassId) {
      setSelectedClassId(watchClassId);
      form.setValue("sectionId", "");
    }
  }, [watchClassId, form]);

  useEffect(() => {
    if (editWatchClassId) {
      setSelectedClassId(editWatchClassId);
    }
  }, [editWatchClassId]);

  const handleOpenAdd = () => {
    if (!classes?.length) {
      toast({
        title: "No classes available",
        description: "Please create at least one class before adding students.",
        variant: "destructive",
      });
      return;
    }
    form.reset();
    setSelectedClassId(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setSelectedClassId(student.classId);
    editForm.reset({
      rollNumber: student.rollNumber,
      classId: student.classId,
      sectionId: student.sectionId,
      guardianName: student.guardianName,
      guardianContact: student.guardianContact,
      guardianEmail: student.guardianEmail || "",
    });
    setEditingStudent(student);
  };

  const handleSubmitAdd = async (values: StudentFormValues) => {
    try {
      const userRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          name: values.name,
          email: values.email,
          role: "student",
        }),
      });

      if (!userRes.ok) {
        const err = await userRes.json();
        throw new Error(err.message || "Failed to create user account");
      }

      const userData = await userRes.json();

      createStudent.mutate(
        {
          userId: userData.user.id,
          admissionNumber: values.admissionNumber,
          rollNumber: values.rollNumber,
          classId: values.classId,
          sectionId: values.sectionId,
          guardianName: values.guardianName,
          guardianContact: values.guardianContact,
          guardianEmail: values.guardianEmail || undefined,
        },
        { 
          onSuccess: () => {
            setIsAddOpen(false);
            toast({ title: "Success", description: "Student enrolled successfully" });
          },
          onError: (error: any) => {
            toast({ 
              title: "Enrollment Failed", 
              description: error.message || "Could not complete enrollment", 
              variant: "destructive" 
            });
          }
        }
      );
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSubmitEdit = (values: EditStudentFormValues) => {
    if (!editingStudent) return;
    updateStudent.mutate(
      {
        id: editingStudent.id,
        data: {
          rollNumber: values.rollNumber,
          classId: values.classId,
          sectionId: values.sectionId,
          guardianName: values.guardianName,
          guardianContact: values.guardianContact,
          guardianEmail: values.guardianEmail || undefined,
        },
      },
      { onSuccess: () => setEditingStudent(null) }
    );
  };

  const handleDelete = () => {
    if (!deletingStudent) return;
    deleteStudent.mutate(deletingStudent.id, { onSuccess: () => setDeletingStudent(null) });
  };

  const getClassName = (classId: string) => classes?.find((c) => c.id === classId)?.name || "Unknown";

  const isLoading = studentsLoading || classesLoading;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Student Management</h1>
            <p className="text-muted-foreground">Manage student enrollments and profiles</p>
          </div>
          <Button onClick={handleOpenAdd} disabled={!classes?.length} data-testid="button-add-student">
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>

        {!classesLoading && !classes?.length && (
          <Card className="border-amber-500/50 bg-amber-500/10">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <div>
                <p className="font-medium">No classes available</p>
                <p className="text-sm text-muted-foreground">
                  Please <Link href="/admin/classes" className="text-primary underline">create at least one class</Link> before adding students.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Students</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : !students?.length ? (
              <p className="text-muted-foreground text-center py-8">No students found. Enroll your first student to get started.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Guardian</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                      <TableCell className="font-medium">{student.admissionNumber}</TableCell>
                      <TableCell>{student.rollNumber}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getClassName(student.classId)}</Badge>
                      </TableCell>
                      <TableCell>{student.guardianName}</TableCell>
                      <TableCell>{student.guardianContact}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(student)} data-testid={`button-edit-${student.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeletingStudent(student)} data-testid={`button-delete-${student.id}`}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>Create a new student account and enrollment</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitAdd)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="johndoe" {...field} data-testid="input-username" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} data-testid="input-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="admissionNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admission Number</FormLabel>
                      <FormControl>
                        <Input placeholder="ADM001" {...field} data-testid="input-admission" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rollNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roll Number</FormLabel>
                      <FormControl>
                        <Input placeholder="1" {...field} data-testid="input-roll" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-class">
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classes?.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sectionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClassId}>
                        <FormControl>
                          <SelectTrigger data-testid="select-section">
                            <SelectValue placeholder={selectedClassId ? "Select section" : "Select class first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sections?.map((section) => (
                            <SelectItem key={section.id} value={section.id}>Section {section.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="guardianName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Doe" {...field} data-testid="input-guardian-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="guardianContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Contact</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 234 567 8900" {...field} data-testid="input-guardian-contact" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="guardianEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guardian Email (optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="guardian@example.com" {...field} data-testid="input-guardian-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createStudent.isPending} data-testid="button-submit-student">
                  {createStudent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Enroll Student
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>Update student enrollment details</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleSubmitEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="rollNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roll Number</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-roll" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classes?.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="sectionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select section" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sections?.map((section) => (
                            <SelectItem key={section.id} value={section.id}>Section {section.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="guardianName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guardian Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="guardianContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guardian Contact</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="guardianEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guardian Email (optional)</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingStudent(null)}>Cancel</Button>
                <Button type="submit" disabled={updateStudent.isPending} data-testid="button-update-student">
                  {updateStudent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Update Student
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingStudent} onOpenChange={(open) => !open && setDeletingStudent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this student record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete">
              {deleteStudent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
