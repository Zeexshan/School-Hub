import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FeesPage() {
  return (
    <Layout>
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Fee Management Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This section will serve as the future interface for billing and 
              payment tracking. Feature development is in progress.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
