import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useClasses, useSections } from "@/hooks/use-classes";
import { useStudents } from "@/hooks/use-students";
import { useAttendanceByDate, useMarkAttendance } from "@/hooks/use-attendance";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function AttendancePage() {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  
  // Local state for attendance marking
  const [attendanceState, setAttendanceState] = useState<Record<string, "Present" | "Absent">>({});

  const { data: classes } = useClasses();
  const { data: sections } = useSections(selectedClass);
  const { data: students } = useStudents();
  const { data: existingAttendance } = useAttendanceByDate(selectedClass, selectedSection, date);
  const { mutate: markAttendance, isPending } = useMarkAttendance();

  // Sync existing attendance to local state
  useEffect(() => {
    if (existingAttendance) {
      const state: Record<string, "Present" | "Absent"> = {};
      existingAttendance.forEach((record: any) => {
        state[record.studentId] = record.status;
      });
      setAttendanceState(state);
    }
  }, [existingAttendance]);
  const filteredStudents = students?.filter(
    (s: any) => s.classId === selectedClass && s.sectionId === selectedSection
  ) || [];

  // Handle save
  const handleSave = () => {
    if (!selectedClass || !selectedSection) return;

    const records = filteredStudents.map((student: any) => ({
      studentId: student.id,
      status: attendanceState[student.id] || "Absent",
    }));

    markAttendance({
      classId: selectedClass,
      sectionId: selectedSection,
      date,
      records,
    }, {
      onSuccess: () => {
        toast({ title: "Attendance saved", description: "Records updated successfully." });
      }
    });
  };

  // Pre-fill state if data exists
  // Note: In a real app use useEffect to sync existingAttendance to local state

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Mark Attendance</h1>
          <p className="text-muted-foreground mt-2">Daily attendance tracking</p>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/4 space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-1/4 space-y-2">
              <label className="text-sm font-medium">Section</label>
              <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  {sections?.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-1/4 space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="block"
              />
            </div>
          </CardContent>
        </Card>

        {selectedClass && selectedSection && (
          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No students found in this section.
                      </TableCell>
                    </TableRow>
                  ) : filteredStudents.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.rollNumber}</TableCell>
                      <TableCell className="font-medium">{student.user?.name || "Unknown"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          <span className={attendanceState[student.id] === "Present" ? "text-primary font-medium" : "text-muted-foreground"}>
                            {attendanceState[student.id] === "Present" ? "Present" : "Absent"}
                          </span>
                          <Switch
                            checked={attendanceState[student.id] === "Present"}
                            onCheckedChange={(checked) => 
                              setAttendanceState(prev => ({
                                ...prev,
                                [student.id]: checked ? "Present" : "Absent"
                              }))
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
                <Button onClick={handleSave} disabled={isPending || filteredStudents.length === 0}>
                  {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Save Attendance
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
