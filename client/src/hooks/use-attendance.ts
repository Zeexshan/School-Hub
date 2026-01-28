import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type BulkAttendanceRequest } from "@shared/routes";

export function useAttendanceByDate(classId: string, sectionId: string, date: string) {
  return useQuery({
    queryKey: [api.attendance.getByClassDate.path, classId, sectionId, date],
    queryFn: async () => {
      if (!classId || !sectionId || !date) return [];
      const url = buildUrl(api.attendance.getByClassDate.path, { classId, sectionId, date });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return api.attendance.getByClassDate.responses[200].parse(await res.json());
    },
    enabled: !!(classId && sectionId && date),
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: BulkAttendanceRequest) => {
      const res = await fetch(api.attendance.bulkMark.path, {
        method: api.attendance.bulkMark.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to mark attendance");
      return api.attendance.bulkMark.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.attendance.getByClassDate.path, variables.classId, variables.sectionId, variables.date]
      });
      queryClient.invalidateQueries({ queryKey: [api.analytics.dashboard.path] });
    },
  });
}
