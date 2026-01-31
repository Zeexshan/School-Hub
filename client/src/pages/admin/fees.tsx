import { useState } from "react";
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
import { Plus, Check, Loader2, AlertCircle, DollarSign } from "lucide-react";
import { useFees, useCreateFee, useMarkFeePaid } from "@/hooks/use-fees";
import { useStudents } from "@/hooks/use-students";
import { useClasses } from "@/hooks/use-classes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import type { Fee } from "@shared/schema";
import { Link } from "wouter";

const feeFormSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Amount must be a positive number"),
  period: z.string().min(1, "Period is required"),
  dueDate: z.string().min(1, "Due date is required"),
});

type FeeFormValues = z.infer<typeof feeFormSchema>;

const FEE_PERIODS = [
  "January 2026",
  "February 2026",
  "March 2026",
  "April 2026",
  "May 2026",
  "June 2026",
  "July 2026",
  "August 2026",
  "September 2026",
  "October 2026",
  "November 2026",
  "December 2026",
];

export default function FeesPage() {
  const { data: fees, isLoading: feesLoading } = useFees();
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: classes } = useClasses();
  const createFee = useCreateFee();
  const markFeePaid = useMarkFeePaid();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [markingPaidFee, setMarkingPaidFee] = useState<Fee | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const form = useForm<FeeFormValues>({
    resolver: zodResolver(feeFormSchema),
    defaultValues: {
      studentId: "",
      amount: "",
      period: "",
      dueDate: "",
    },
  });

  const handleOpenAdd = () => {
    if (!students?.length) {
      toast({
        title: "No students available",
        description: "Please enroll at least one student before creating fee records.",
        variant: "destructive",
      });
      return;
    }
    form.reset();
    setIsAddOpen(true);
  };

  const handleSubmitAdd = (values: FeeFormValues) => {
    createFee.mutate(
      {
        studentId: values.studentId,
        amount: parseFloat(values.amount),
        period: values.period,
        dueDate: values.dueDate,
        status: "Pending",
      },
      { onSuccess: () => setIsAddOpen(false) }
    );
  };

  const handleMarkPaid = () => {
    if (!markingPaidFee) return;
    markFeePaid.mutate(markingPaidFee.id, { onSuccess: () => setMarkingPaidFee(null) });
  };

  const getStudentInfo = (studentId: string) => {
    const student = students?.find((s) => s.id === studentId);
    if (!student) return { admission: "Unknown", className: "Unknown" };
    const cls = classes?.find((c) => c.id === student.classId);
    return {
      admission: student.admissionNumber,
      className: cls?.name || "Unknown",
    };
  };

  const filteredFees = fees?.filter((fee) => {
    if (filterStatus === "all") return true;
    return fee.status === filterStatus;
  });

  const totalPending = fees?.filter((f) => f.status === "Pending").reduce((sum, f) => sum + f.amount, 0) || 0;
  const totalCleared = fees?.filter((f) => f.status === "Cleared").reduce((sum, f) => sum + f.amount, 0) || 0;

  const isLoading = feesLoading || studentsLoading;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Fee Management</h1>
            <p className="text-muted-foreground">Track and manage student fees</p>
          </div>
          <Button onClick={handleOpenAdd} disabled={!students?.length} data-testid="button-add-fee">
            <Plus className="w-4 h-4 mr-2" />
            Add Fee Record
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <DollarSign className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Fees</p>
                  <p className="text-2xl font-bold" data-testid="text-pending-total">${totalPending.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Check className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cleared Fees</p>
                  <p className="text-2xl font-bold" data-testid="text-cleared-total">${totalCleared.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                  <p className="text-2xl font-bold" data-testid="text-total-records">{fees?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {!studentsLoading && !students?.length && (
          <Card className="border-amber-500/50 bg-amber-500/10">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <div>
                <p className="font-medium">No students available</p>
                <p className="text-sm text-muted-foreground">
                  Please <Link href="/admin/students" className="text-primary underline">enroll at least one student</Link> before creating fee records.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap space-y-0">
            <CardTitle>Fee Records</CardTitle>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]" data-testid="select-filter-status">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Cleared">Cleared</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : !filteredFees?.length ? (
              <p className="text-muted-foreground text-center py-8">
                {filterStatus === "all" ? "No fee records found." : `No ${filterStatus.toLowerCase()} fee records.`}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFees.map((fee) => {
                    const studentInfo = getStudentInfo(fee.studentId);
                    return (
                      <TableRow key={fee.id} data-testid={`row-fee-${fee.id}`}>
                        <TableCell className="font-medium">{studentInfo.admission}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{studentInfo.className}</Badge>
                        </TableCell>
                        <TableCell>{fee.period}</TableCell>
                        <TableCell>${fee.amount.toFixed(2)}</TableCell>
                        <TableCell>{new Date(fee.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={fee.status === "Cleared" ? "default" : "destructive"}>
                            {fee.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {fee.status === "Pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setMarkingPaidFee(fee)}
                              data-testid={`button-mark-paid-${fee.id}`}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Mark Paid
                            </Button>
                          )}
                          {fee.status === "Cleared" && fee.paidDate && (
                            <span className="text-sm text-muted-foreground">
                              Paid: {new Date(fee.paidDate).toLocaleDateString()}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Fee Record</DialogTitle>
            <DialogDescription>Create a new fee record for a student</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitAdd)} className="space-y-4">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-student">
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students?.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.admissionNumber} - {classes?.find((c) => c.id === student.classId)?.name || "Unknown"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="100.00" {...field} data-testid="input-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-period">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FEE_PERIODS.map((period) => (
                          <SelectItem key={period} value={period}>{period}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-due-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createFee.isPending} data-testid="button-submit-fee">
                  {createFee.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Fee Record
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!markingPaidFee} onOpenChange={(open) => !open && setMarkingPaidFee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Fee as Paid</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this fee of ${markingPaidFee?.amount.toFixed(2)} for {markingPaidFee?.period} as paid?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkPaid} data-testid="button-confirm-mark-paid">
              {markFeePaid.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
