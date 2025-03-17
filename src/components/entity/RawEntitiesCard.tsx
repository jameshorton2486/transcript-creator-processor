
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { EntityTypeSection } from "./EntityTypeSection";

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
          {entityTypes.map((entityType, index) => (
            <EntityTypeSection
              key={entityType}
              entityType={entityType}
              entities={entities[entityType]}
              isLast={index === entityTypes.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
