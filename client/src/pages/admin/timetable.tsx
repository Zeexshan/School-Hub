import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Class, Section, User, Timetable } from "@shared/schema";

const timetableFormSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  sectionId: z.string().min(1, "Section is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  subject: z.string().min(1, "Subject is required"),
  dayOfWeek: z.coerce.number().min(1).max(6),
  periodNumber: z.coerce.number().min(1).max(8),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

type TimetableFormValues = z.infer<typeof timetableFormSchema>;

const DAYS = [
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
];

export default function TimetablePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");

  const { data: classes } = useQuery<Class[]>({ queryKey: ["/api/classes"] });
  const { data: sections } = useQuery<Section[]>({ 
    queryKey: [`/api/classes/${selectedClass}/sections`],
    enabled: !!selectedClass 
  });
  const { data: teachers } = useQuery<User[]>({ queryKey: ["/api/users/role/teacher"] });
  const { data: timetable, isLoading } = useQuery<Timetable[]>({
    queryKey: [`/api/timetable/class/${selectedClass}/section/${selectedSection}`],
    enabled: !!selectedClass && !!selectedSection
  });

  const createEntry = useMutation({
    mutationFn: async (data: TimetableFormValues) => {
      const res = await apiRequest("POST", "/api/timetable", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/timetable/class/${selectedClass}/section/${selectedSection}`] });
      toast({ title: "Success", description: "Timetable entry added" });
      form.reset({
        ...form.getValues(),
        periodNumber: (form.getValues().periodNumber % 8) + 1
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/timetable/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/timetable/class/${selectedClass}/section/${selectedSection}`] });
      toast({ title: "Deleted", description: "Timetable entry removed" });
    },
  });

  const form = useForm<TimetableFormValues>({
    resolver: zodResolver(timetableFormSchema),
    defaultValues: {
      classId: "",
      sectionId: "",
      teacherId: "",
      subject: "",
      dayOfWeek: 1,
      periodNumber: 1,
      startTime: "09:00",
      endTime: "09:45",
    },
  });

  const renderCell = (dayId: number, periodNum: number) => {
    const entry = timetable?.find(e => e.dayOfWeek === dayId && e.periodNumber === periodNum);
    if (!entry) return <div className="h-20 border border-dashed rounded-md flex items-center justify-center text-muted-foreground text-xs">Free</div>;

    const teacher = teachers?.find(t => t.id === entry.teacherId);

    return (
      <div className="h-20 p-2 bg-primary/10 border border-primary/20 rounded-md relative group">
        <div className="font-bold text-sm truncate">{entry.subject}</div>
        <div className="text-xs text-muted-foreground truncate">{teacher?.name}</div>
        <div className="text-[10px] text-muted-foreground mt-1">{entry.startTime}-{entry.endTime}</div>
        <Button
          variant="destructive"
          size="icon"
          className="h-6 w-6 absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => deleteEntry.mutate(entry.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Academic Timetable</h1>
            <p className="text-muted-foreground">Manage period assignments and teacher schedules</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Schedule Period</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createEntry.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="classId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <Select onValueChange={(val) => { field.onChange(val); setSelectedClass(val); }} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
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
                        <Select onValueChange={(val) => { field.onChange(val); setSelectedSection(val); }} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Section" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sections?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="teacherId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teacher</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Teacher" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teachers?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Mathematics" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="dayOfWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Day</FormLabel>
                          <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DAYS.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="periodNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Period</FormLabel>
                          <Input type="number" min={1} max={8} {...field} />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start</FormLabel>
                          <Input type="time" {...field} />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End</FormLabel>
                          <Input type="time" {...field} />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createEntry.isPending}>
                    {createEntry.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus className="h-4 w-4 mr-2" />}
                    Add Period
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Weekly Timetable
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedClass || !selectedSection ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Calendar className="h-12 w-12 mb-4 opacity-20" />
                  <p>Select a class and section to view timetable</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 border bg-muted/50 w-24">Day</th>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                          <th key={p} className="p-2 border bg-muted/50 min-w-[120px]">Period {p}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DAYS.map(day => (
                        <tr key={day.id}>
                          <td className="p-2 border font-bold text-sm bg-muted/20">{day.name}</td>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                            <td key={p} className="p-2 border">
                              {renderCell(day.id, p)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
