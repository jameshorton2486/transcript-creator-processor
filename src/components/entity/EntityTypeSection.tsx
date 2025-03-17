
import { Separator } from "@/components/ui/separator";
import { EntityBadgeList } from "./EntityBadgeList";

interface EntityTypeSectionProps {
  entityType: string;
  entities: string[];
  isLast: boolean;
}

export const EntityTypeSection = ({ 
  entityType, 
  entities, 
  isLast 
}: EntityTypeSectionProps) => {
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">{entityType}</h4>
      <EntityBadgeList entities={entities} />
      
      {!isLast && <Separator className="mt-3" />}
    </div>
  );
};
