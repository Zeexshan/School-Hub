import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, BookOpen, Loader2 } from "lucide-react";
import { useClasses, useCreateClass, useUpdateClass, useDeleteClass, useSections, useCreateSection, useDeleteSection } from "@/hooks/use-classes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Class } from "@shared/schema";

const classFormSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  subjects: z.string().min(1, "At least one subject is required"),
});

type ClassFormValues = z.infer<typeof classFormSchema>;

const sectionFormSchema = z.object({
  name: z.string().min(1, "Section name is required"),
  roomNumber: z.string().optional(),
});

type SectionFormValues = z.infer<typeof sectionFormSchema>;

export default function ClassesPage() {
  const { data: classes, isLoading } = useClasses();
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [deletingClass, setDeletingClass] = useState<Class | null>(null);
  const [managingSectionsFor, setManagingSectionsFor] = useState<Class | null>(null);

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: { name: "", subjects: "" },
  });

  const handleOpenAdd = () => {
    form.reset({ name: "", subjects: "" });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (cls: Class) => {
    form.reset({ name: cls.name, subjects: cls.subjects.join(", ") });
    setEditingClass(cls);
  };

  const handleSubmitAdd = (values: ClassFormValues) => {
    createClass.mutate(
      { name: values.name, subjects: values.subjects.split(",").map((s) => s.trim()).filter(Boolean) },
      { onSuccess: () => setIsAddOpen(false) }
    );
  };

  const handleSubmitEdit = (values: ClassFormValues) => {
    if (!editingClass) return;
    updateClass.mutate(
      { id: editingClass.id, data: { name: values.name, subjects: values.subjects.split(",").map((s) => s.trim()).filter(Boolean) } },
      { onSuccess: () => setEditingClass(null) }
    );
  };

  const handleDelete = () => {
    if (!deletingClass) return;
    deleteClass.mutate(deletingClass.id, { onSuccess: () => setDeletingClass(null) });
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Class Management</h1>
            <p className="text-muted-foreground">Manage classes and their sections</p>
          </div>
          <Button onClick={handleOpenAdd} data-testid="button-add-class">
            <Plus className="w-4 h-4 mr-2" />
            Add Class
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Classes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : !classes?.length ? (
              <p className="text-muted-foreground text-center py-8">No classes found. Create your first class to get started.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class Name</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((cls) => (
                    <TableRow key={cls.id} data-testid={`row-class-${cls.id}`}>
                      <TableCell className="font-medium">{cls.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {cls.subjects.map((subject, i) => (
                            <Badge key={i} variant="secondary">{subject}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setManagingSectionsFor(cls)} data-testid={`button-sections-${cls.id}`}>
                            <BookOpen className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(cls)} data-testid={`button-edit-${cls.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeletingClass(cls)} data-testid={`button-delete-${cls.id}`}>
                            <Trash2 className="w-4 h-4 text-destructive" />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
            <DialogDescription>Create a new class with subjects</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitAdd)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Grade 10" {...field} data-testid="input-class-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subjects"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subjects (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Math, Science, English" {...field} data-testid="input-subjects" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createClass.isPending} data-testid="button-submit-class">
                  {createClass.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Class
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingClass} onOpenChange={(open) => !open && setEditingClass(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>Update class details</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-class-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subjects"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subjects (comma-separated)</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-subjects" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingClass(null)}>Cancel</Button>
                <Button type="submit" disabled={updateClass.isPending} data-testid="button-update-class">
                  {updateClass.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Update Class
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingClass} onOpenChange={(open) => !open && setDeletingClass(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingClass?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete">
              {deleteClass.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {managingSectionsFor && (
        <SectionsDialog
          classItem={managingSectionsFor}
          onClose={() => setManagingSectionsFor(null)}
        />
      )}
    </Layout>
  );
}

function SectionsDialog({ classItem, onClose }: { classItem: Class; onClose: () => void }) {
  const { data: sections, isLoading } = useSections(classItem.id);
  const createSection = useCreateSection();
  const deleteSection = useDeleteSection();
  const [isAdding, setIsAdding] = useState(false);

  const form = useForm<SectionFormValues>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues: { name: "", roomNumber: "" },
  });

  const handleAddSection = (values: SectionFormValues) => {
    createSection.mutate(
      { name: values.name, classId: classItem.id, roomNumber: values.roomNumber || undefined },
      { onSuccess: () => { setIsAdding(false); form.reset(); } }
    );
  };

  const handleDeleteSection = (sectionId: string) => {
    deleteSection.mutate({ id: sectionId, classId: classItem.id });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Sections for {classItem.name}</DialogTitle>
          <DialogDescription>Manage sections within this class</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : !sections?.length ? (
            <p className="text-muted-foreground text-center py-4">No sections yet</p>
          ) : (
            <div className="space-y-2">
              {sections.map((section) => (
                <div key={section.id} className="flex items-center justify-between p-3 bg-muted rounded-lg" data-testid={`section-${section.id}`}>
                  <div>
                    <span className="font-medium">Section {section.name}</span>
                    {section.roomNumber && (
                      <span className="text-muted-foreground ml-2">(Room {section.roomNumber})</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSection(section.id)}
                    disabled={deleteSection.isPending}
                    data-testid={`button-delete-section-${section.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {isAdding ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddSection)} className="space-y-3 p-3 border rounded-lg">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., A, B, C" {...field} data-testid="input-section-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="roomNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Number (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 101" {...field} data-testid="input-room-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                  <Button type="submit" disabled={createSection.isPending} data-testid="button-submit-section">
                    {createSection.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Add Section
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full" data-testid="button-add-section">
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
