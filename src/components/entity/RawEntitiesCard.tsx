
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface RawEntitiesCardProps {
  entities: Record<string, string[]>;
}

export const RawEntitiesCard = ({ entities }: RawEntitiesCardProps) => {
  const entityTypes = Object.keys(entities);
  
  return (
    <Card className="h-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Raw Extracted Entities</CardTitle>
        <CardDescription>
          Original entity categories from the extraction process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entityTypes.map((entityType) => (
            <div key={entityType}>
              <h4 className="text-sm font-medium mb-2">{entityType}</h4>
              <div className="flex flex-wrap gap-2">
                {entities[entityType].map((entity, index) => (
                  <Badge key={index} variant="secondary" className="bg-slate-100 text-slate-800">
                    {entity}
                  </Badge>
                ))}
              </div>
              {entityType !== entityTypes[entityTypes.length - 1] && (
                <Separator className="mt-3" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
