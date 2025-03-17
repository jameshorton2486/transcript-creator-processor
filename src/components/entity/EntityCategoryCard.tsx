
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

interface EntityCategoryCardProps {
  category: string;
  entities: string[];
}

export const EntityCategoryCard = ({ category, entities }: EntityCategoryCardProps) => {
  // Determine if this category should use a list layout instead of badges
  const useListLayout = category === "Proper Names" || category === "Individuals";
  
  return (
    <Card className="h-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{category}</CardTitle>
        <CardDescription>
          {entities.length} {entities.length === 1 ? "entry" : "entries"} found
        </CardDescription>
      </CardHeader>
      <CardContent>
        {useListLayout ? (
          <ul className="list-disc pl-5 space-y-1">
            {entities.map((entity, index) => (
              <li key={index} className="text-sm">
                {entity}
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-wrap gap-2">
            {entities.map((entity, index) => (
              <Badge key={index} variant="secondary" className="bg-slate-100 text-slate-800">
                {entity}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
