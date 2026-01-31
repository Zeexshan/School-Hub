import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate, indianPhoneRegex } from "@/lib/indian-utils";
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
import { Plus, Pencil, Loader2, CreditCard } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TeacherWithProfile } from "@shared/schema";

const teacherFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  subjectSpecialization: z.string().min(1, "Subject is required"),
  salary: z.coerce.number().positive("Salary must be positive"),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"),
  aadhaarNumber: z.string().length(12, "Aadhaar must be 12 digits"),
  qualification: z.string().min(1, "Qualification is required"),
  joinDate: z.string().min(1, "Join date is required"),
  designation: z.string().min(1, "Designation is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
});

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

const editTeacherFormSchema = z.object({
  subjectSpecialization: z.string().min(1, "Subject is required"),
  salary: z.coerce.number().positive("Salary must be positive"),
  qualification: z.string().min(1, "Qualification is required"),
  designation: z.string().min(1, "Designation is required"),
});

type EditTeacherFormValues = z.infer<typeof editTeacherFormSchema>;

export default function TeachersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: teachers, isLoading } = useQuery<TeacherWithProfile[]>({
    queryKey: ["/api/teachers"],
  });

  const createTeacher = useMutation({
    mutationFn: async (data: TeacherFormValues) => {
      const payload = {
        ...data,
        subjectSpecialization: [data.subjectSpecialization]
      };
      const res = await apiRequest("POST", "/api/teachers", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({ title: "Success", description: "Teacher registered successfully" });
      setIsAddOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateTeacher = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditTeacherFormValues }) => {
      const payload = {
        ...data,
        subjectSpecialization: [data.subjectSpecialization]
      };
      const res = await apiRequest("PATCH", `/api/teachers/${id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({ title: "Success", description: "Teacher updated successfully" });
      setEditingTeacher(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const paySalary = useMutation({
    mutationFn: async ({ id, month, amount }: { id: string; month: string; amount: number }) => {
      const res = await apiRequest("POST", `/api/teachers/${id}/pay-salary`, { month, amount });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({ title: "Success", description: "Salary paid successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherWithProfile | null>(null);

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      subjectSpecialization: "",
      salary: 0,
      panNumber: "",
      aadhaarNumber: "",
      qualification: "",
      joinDate: new Date().toISOString().split('T')[0],
      designation: "Teacher",
      employeeId: "",
    },
  });

  const editForm = useForm<EditTeacherFormValues>({
    resolver: zodResolver(editTeacherFormSchema),
    defaultValues: {
      subjectSpecialization: "",
      salary: 0,
      qualification: "",
      designation: "",
    },
  });

  const handleOpenAdd = () => {
    form.reset();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (teacher: TeacherWithProfile) => {
    editForm.reset({
      subjectSpecialization: teacher.profile?.subjectSpecialization?.[0] || "",
      salary: teacher.profile?.salary || 0,
      qualification: teacher.profile?.qualification || "",
      designation: teacher.profile?.designation || "",
    });
    setEditingTeacher(teacher);
  };

  const handleSubmitAdd = (values: TeacherFormValues) => {
    createTeacher.mutate(values);
  };

  const handleSubmitEdit = (values: EditTeacherFormValues) => {
    if (!editingTeacher) return;
    updateTeacher.mutate({ id: editingTeacher.id, data: values });
  };

  const handlePaySalary = (teacher: TeacherWithProfile) => {
    if (!teacher.profile) return;
    const currentMonth = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date());
    paySalary.mutate({ id: teacher.id, month: currentMonth, amount: teacher.profile.salary });
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Teacher & Staff Management</h1>
            <p className="text-muted-foreground">Manage faculty profiles and payroll</p>
          </div>
          <Button onClick={handleOpenAdd} data-testid="button-add-teacher">
            <Plus className="w-4 h-4 mr-2" />
            Add Teacher
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Faculty Directory</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : !teachers?.length ? (
              <p className="text-muted-foreground text-center py-8">No teachers found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow key={teacher.id} data-testid={`row-teacher-${teacher.id}`}>
                      <TableCell className="font-mono text-xs">{teacher.profile?.employeeId || "N/A"}</TableCell>
                      <TableCell className="font-medium">{teacher.name}</TableCell>
                      <TableCell>{teacher.profile?.subjectSpecialization?.join(", ") || "N/A"}</TableCell>
                      <TableCell>{teacher.profile ? formatCurrency(teacher.profile.salary) : "N/A"}</TableCell>
                      <TableCell>{teacher.profile ? formatDate(teacher.profile.joinDate) : "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handlePaySalary(teacher)}
                            disabled={paySalary.isPending}
                            className="text-primary hover:text-primary"
                          >
                            <CreditCard className="w-4 h-4 mr-1" />
                            Pay
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleOpenEdit(teacher)} 
                            data-testid={`button-edit-${teacher.id}`}
                          >
                            <Pencil className="w-4 h-4" />
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Register New Faculty</DialogTitle>
            <DialogDescription>Add professional and HR details for staff members</DialogDescription>
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
                        <Input placeholder="Rajesh Kumar" {...field} data-testid="input-name" />
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
                        <Input type="email" placeholder="rajesh@school.com" {...field} data-testid="input-email" />
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
                        <Input placeholder="rajesh_k" {...field} data-testid="input-username" />
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
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee ID</FormLabel>
                      <FormControl>
                        <Input placeholder="EMP001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation</FormLabel>
                      <FormControl>
                        <Input placeholder="Senior Teacher" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="panNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN Number</FormLabel>
                      <FormControl>
                        <Input placeholder="ABCDE1234F" {...field} className="uppercase" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="aadhaarNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aadhaar Number</FormLabel>
                      <FormControl>
                        <Input placeholder="12-digit number" {...field} maxLength={12} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="subjectSpecialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Physics" {...field} data-testid="input-subject" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Salary</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="45000" {...field} data-testid="input-salary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="qualification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualification</FormLabel>
                      <FormControl>
                        <Input placeholder="M.Sc. Physics, B.Ed." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="joinDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Join Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createTeacher.isPending} data-testid="button-submit-teacher">
                  {createTeacher.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Register Faculty
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTeacher} onOpenChange={(open) => !open && setEditingTeacher(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Faculty Profile</DialogTitle>
            <DialogDescription>Modify teacher specializations or compensation</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleSubmitEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="subjectSpecialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-subject" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="qualification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qualification</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Salary</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} data-testid="input-edit-salary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingTeacher(null)}>Cancel</Button>
                <Button type="submit" disabled={updateTeacher.isPending} data-testid="button-update-teacher">
                  {updateTeacher.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Update Faculty
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
