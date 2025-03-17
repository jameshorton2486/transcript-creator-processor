
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyEntityState } from "@/components/entity/EmptyEntityState";
import { EntityCategoryCard } from "@/components/entity/EntityCategoryCard";
import { RawEntitiesCard } from "@/components/entity/RawEntitiesCard";
import { processEntities } from "@/utils/entityProcessingUtils";

interface EntityDisplayProps {
  entities: Record<string, string[]>;
}

export const EntityDisplay = ({ entities }: EntityDisplayProps) => {
  const entityTypes = Object.keys(entities);
  
  // Return early if no entities are found
  if (entityTypes.length === 0) {
    return <EmptyEntityState />;
  }

  // Process and categorize entities
  const categorizedEntities = processEntities(entities);

  return (
    <div className="h-full">
      <ScrollArea className="h-full pr-4">
        <div className="space-y-6">
          {/* Display categorized entities */}
          {Object.keys(categorizedEntities).map((category) => (
            <EntityCategoryCard
              key={category}
              category={category}
              entities={categorizedEntities[category as keyof typeof categorizedEntities]}
            />
          ))}

          {/* Display raw entities */}
          <RawEntitiesCard entities={entities} />
        </div>
      </ScrollArea>
    </div>
  );
};
