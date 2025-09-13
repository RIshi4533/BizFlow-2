import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>An overview of the {title.toLowerCase()} module.</CardDescription>
          </div>
        </CardHeader>
      </Card>
      <Card className="flex-1">
        <CardContent className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
          <Construction className="w-16 h-16 mb-4 text-primary" />
          <h3 className="text-2xl font-semibold">Coming Soon!</h3>
          <p className="mt-2 max-w-md">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
