import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { User, Receipt, Calendar, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Student, Fee, Timetable, Class, Section } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function StudentDashboard() {
  const { user } = useAuth();
  
  const { data: student } = useQuery<Student>({
    queryKey: ["/api/students/me"],
    enabled: !!user,
  });

  const { data: fees } = useQuery<Fee[]>({
    queryKey: ["/api/fees/student", student?.id],
    enabled: !!student?.id,
  });

  const { data: timetable } = useQuery<Timetable[]>({
    queryKey: ["/api/timetable/class", student?.classId],
    enabled: !!student?.classId,
  });

  const { data: classes } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const { data: sections } = useQuery<Section[]>({
    queryKey: ["/api/sections"],
  });

  const currentClass = classes?.find(c => c.id === student?.classId);
  const currentSection = sections?.find(s => s.id === student?.sectionId);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-card">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-bold">Student Dashboard</h1>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="hover-elevate">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">My Class</CardTitle>
                  <GraduationCap className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentClass?.name} - {currentSection?.name}</div>
                </CardContent>
              </Card>
              
              <Card className="hover-elevate">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Roll Number</CardTitle>
                  <User className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{student?.rollNumber || "N/A"}</div>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Fee Status</CardTitle>
                  <Receipt className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  {fees && fees.some(f => f.status === "Pending") ? (
                    <Badge variant="destructive" className="text-sm">Pending</Badge>
                  ) : (
                    <Badge variant="outline" className="text-sm text-green-600 border-green-200 bg-green-50">Cleared</Badge>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>My Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  {timetable && timetable.length > 0 ? (
                    <div className="space-y-4">
                      {timetable
                        .filter(t => t.dayOfWeek === (new Date().getDay() || 7))
                        .sort((a,b) => a.periodNumber - b.periodNumber)
                        .map((period) => (
                        <div key={period.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                          <div>
                            <p className="font-medium">{period.subject}</p>
                            <p className="text-xs text-muted-foreground">Period {period.periodNumber}</p>
                          </div>
                          <div className="text-right text-xs">
                            {period.startTime} - {period.endTime}
                          </div>
                        </div>
                      ))}
                      {timetable.filter(t => t.dayOfWeek === (new Date().getDay() || 7)).length === 0 && (
                        <p className="text-center text-muted-foreground py-4">No classes today</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No timetable found</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Profile Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Admission No:</span>
                    <span className="font-medium">{student?.admissionNumber}</span>
                    <span className="text-muted-foreground">Guardian:</span>
                    <span className="font-medium">{student?.guardianName}</span>
                    <span className="text-muted-foreground">Guardian Contact:</span>
                    <span className="font-medium">{student?.guardianContact}</span>
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium truncate">{user?.email}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
