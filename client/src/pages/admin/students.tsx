import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentsPage() {
  return (
    <Layout>
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Management Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This page will allow administrators to manage the student directory, 
              enrollments, and student profiles. Feature development is in progress.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
