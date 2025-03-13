
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

interface EntityDisplayProps {
  entities: Record<string, string[]>;
}

export const EntityDisplay = ({ entities }: EntityDisplayProps) => {
  const entityTypes = Object.keys(entities);

  // Helper function to get an appropriate color for each entity type
  const getEntityColor = (entityType: string): string => {
    const colorMap: Record<string, string> = {
      PERSON: "bg-blue-100 text-blue-800",
      ORG: "bg-purple-100 text-purple-800",
      DATE: "bg-green-100 text-green-800",
      TIME: "bg-green-100 text-green-800",
      MONEY: "bg-yellow-100 text-yellow-800",
      GPE: "bg-red-100 text-red-800", // Countries, cities, states
      LAW: "bg-indigo-100 text-indigo-800",
      CASE: "bg-rose-100 text-rose-800",
      COURT: "bg-amber-100 text-amber-800",
      JUDGE: "bg-cyan-100 text-cyan-800",
      STATUTE: "bg-emerald-100 text-emerald-800",
    };

    return colorMap[entityType] || "bg-gray-100 text-gray-800";
  };

  // Get a more readable entity type name
  const getReadableEntityType = (entityType: string): string => {
    const nameMap: Record<string, string> = {
      PERSON: "People",
      ORG: "Organizations",
      DATE: "Dates",
      TIME: "Times",
      MONEY: "Monetary Values",
      GPE: "Locations",
      LAW: "Laws",
      CASE: "Cases",
      COURT: "Courts",
      JUDGE: "Judges",
      STATUTE: "Statutes",
    };

    return nameMap[entityType] || entityType;
  };

  if (entityTypes.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500">
        No entities were found in this transcript.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {entityTypes.map((entityType) => (
        <Card key={entityType}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{getReadableEntityType(entityType)}</CardTitle>
            <CardDescription>
              {entities[entityType].length} {entities[entityType].length === 1 ? "entry" : "entries"} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {entities[entityType].map((entity, index) => (
                <Badge key={index} variant="secondary" className={getEntityColor(entityType)}>
                  {entity}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
