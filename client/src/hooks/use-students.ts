import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertStudent } from "@shared/routes";

export function useStudents() {
  return useQuery({
    queryKey: [api.students.list.path],
    queryFn: async () => {
      const res = await fetch(api.students.list.path);
      if (!res.ok) throw new Error("Failed to fetch students");
      return api.students.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertStudent) => {
      const res = await fetch(api.students.create.path, {
        method: api.students.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create student");
      return api.students.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.students.list.path] }),
  });
}
