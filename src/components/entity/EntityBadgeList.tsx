
import { Badge } from "@/components/ui/badge";

interface EntityBadgeListProps {
  entities: string[];
}

export const EntityBadgeList = ({ entities }: EntityBadgeListProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {entities.map((entity, index) => (
        <Badge 
          key={index} 
          variant="secondary" 
          className="bg-slate-100 text-slate-800"
        >
          {entity}
        </Badge>
      ))}
    </div>
  );
};
