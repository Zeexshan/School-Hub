import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Calendar, Users, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Timetable, Class, Section } from "@shared/schema";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function TeacherDashboard() {
  const { user } = useAuth();
  
  const { data: timetable } = useQuery<Timetable[]>({
    queryKey: ["/api/timetable/teacher", user?.id],
    enabled: !!user?.id,
  });

  const { data: classes } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const { data: sections } = useQuery<Section[]>({
    queryKey: ["/api/sections"],
  });

  const today = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  // Our schema uses 1=Mon, 6=Sat. 
  const todaySchedule = timetable?.filter(t => t.dayOfWeek === (today === 0 ? 7 : today)) || [];

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-card">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-bold">Teacher Dashboard</h1>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="hover-elevate">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Today's Periods</CardTitle>
                  <Calendar className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todaySchedule.length}</div>
                </CardContent>
              </Card>
              
              <Card className="hover-elevate">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Classes</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{new Set(timetable?.map(t => t.classId)).size}</div>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Quick Action</CardTitle>
                  <CheckCircle className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <Link href="/teacher/attendance">
                    <Button variant="outline" className="w-full">Mark Attendance</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                {todaySchedule.length > 0 ? (
                  <div className="space-y-4">
                    {todaySchedule.sort((a,b) => a.periodNumber - b.periodNumber).map((period) => {
                      const cls = classes?.find(c => c.id === period.classId);
                      const sec = sections?.find(s => s.id === period.sectionId);
                      return (
                        <div key={period.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                          <div>
                            <p className="font-semibold">{period.subject}</p>
                            <p className="text-sm text-muted-foreground">
                              {cls?.name} - {sec?.name} | Period {period.periodNumber}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{period.startTime} - {period.endTime}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No classes scheduled for today.
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
