
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
      "People": "bg-blue-100 text-blue-800",
      "PERSON": "bg-blue-100 text-blue-800",
      "Organizations": "bg-purple-100 text-purple-800",
      "ORG": "bg-purple-100 text-purple-800",
      "Dates": "bg-green-100 text-green-800",
      "DATE": "bg-green-100 text-green-800",
      "Times": "bg-green-100 text-green-800",
      "TIME": "bg-green-100 text-green-800",
      "Money": "bg-yellow-100 text-yellow-800",
      "MONEY": "bg-yellow-100 text-yellow-800",
      "Locations": "bg-red-100 text-red-800",
      "GPE": "bg-red-100 text-red-800", // Countries, cities, states
      "Laws": "bg-indigo-100 text-indigo-800",
      "LAW": "bg-indigo-100 text-indigo-800",
      "Cases": "bg-rose-100 text-rose-800",
      "CASE": "bg-rose-100 text-rose-800",
      "Courts": "bg-amber-100 text-amber-800",
      "COURT": "bg-amber-100 text-amber-800",
      "Judges": "bg-cyan-100 text-cyan-800",
      "JUDGE": "bg-cyan-100 text-cyan-800",
      "Statutes": "bg-emerald-100 text-emerald-800",
      "STATUTE": "bg-emerald-100 text-emerald-800",
      "Legal Terms": "bg-sky-100 text-sky-800"
    };

    return colorMap[entityType] || "bg-gray-100 text-gray-800";
  };

  // Get a more readable entity type name
  const getReadableEntityType = (entityType: string): string => {
    const nameMap: Record<string, string> = {
      "PERSON": "People",
      "ORG": "Organizations",
      "DATE": "Dates",
      "TIME": "Times",
      "MONEY": "Monetary Values",
      "GPE": "Locations",
      "LAW": "Laws",
      "CASE": "Cases",
      "COURT": "Courts",
      "JUDGE": "Judges",
      "STATUTE": "Statutes"
    };

    return nameMap[entityType] || entityType;
  };

  const sortedEntityTypes = entityTypes.sort((a, b) => {
    // Sort order: People first, then Organizations, then others alphabetically
    const order: Record<string, number> = {
      "People": 1,
      "PERSON": 1,
      "Organizations": 2,
      "ORG": 2
    };
    
    const orderA = order[a] || 100;
    const orderB = order[b] || 100;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // Alphabetical for everything else
    return getReadableEntityType(a).localeCompare(getReadableEntityType(b));
  });

  if (entityTypes.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500">
        No entities were found in this transcript.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedEntityTypes.map((entityType) => (
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
