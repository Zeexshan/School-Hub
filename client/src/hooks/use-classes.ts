import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertClass, type InsertSection } from "@shared/routes";

export function useClasses() {
  return useQuery({
    queryKey: [api.classes.list.path],
    queryFn: async () => {
      const res = await fetch(api.classes.list.path);
      if (!res.ok) throw new Error("Failed to fetch classes");
      return api.classes.list.responses[200].parse(await res.json());
    },
  });
}

export function useClass(id: string) {
  return useQuery({
    queryKey: [api.classes.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.classes.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch class");
      return api.classes.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertClass) => {
      const res = await fetch(api.classes.create.path, {
        method: api.classes.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create class");
      return api.classes.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.classes.list.path] }),
  });
}

export function useSections(classId: string) {
  return useQuery({
    queryKey: [api.sections.list.path, classId],
    queryFn: async () => {
      const url = buildUrl(api.sections.list.path, { classId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch sections");
      return api.sections.list.responses[200].parse(await res.json());
    },
    enabled: !!classId,
  });
}

export function useCreateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertSection) => {
      const res = await fetch(api.sections.create.path, {
        method: api.sections.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create section");
      return api.sections.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => queryClient.invalidateQueries({ 
      queryKey: [api.sections.list.path, variables.classId] 
    }),
  });
}
