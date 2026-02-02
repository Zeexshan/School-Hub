import {
  Calendar,
  Home,
  Users,
  CheckCircle,
  LayoutDashboard,
  GraduationCap,
  Receipt,
  BookOpen,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";

export function AppSidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const menuItems = {
    admin: [
      { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
      { title: "Teachers", url: "/admin/teachers", icon: Users },
      { title: "Classes", url: "/admin/classes", icon: GraduationCap },
      { title: "Students", url: "/admin/students", icon: Users },
      { title: "Timetable", url: "/admin/timetable", icon: Calendar },
      { title: "Fees", url: "/admin/fees", icon: Receipt },
    ],
    teacher: [
      { title: "Dashboard", url: "/teacher/dashboard", icon: LayoutDashboard },
      { title: "Mark Attendance", url: "/teacher/attendance", icon: CheckCircle },
      { title: "Schedule", url: "/teacher/dashboard", icon: Calendar },
    ],
    student: [
      { title: "Dashboard", url: "/student/dashboard", icon: LayoutDashboard },
      { title: "My Fees", url: "/student/dashboard", icon: Receipt },
      { title: "Timetable", url: "/student/dashboard", icon: Calendar },
    ],
  };

  const roleItems = user ? (menuItems[user.role as keyof typeof menuItems] || []) : [];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            School ERP
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {roleItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
