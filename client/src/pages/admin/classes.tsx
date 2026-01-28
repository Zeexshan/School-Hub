import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClassesPage() {
  return (
    <Layout>
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Class Management Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This interface will be used for creating and editing classes, 
              managing sections, and defining the academic structure. Feature development is in progress.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
