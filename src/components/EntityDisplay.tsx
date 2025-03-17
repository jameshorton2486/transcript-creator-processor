
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EntityDisplayProps {
  entities: Record<string, string[]>;
}

export const EntityDisplay = ({ entities }: EntityDisplayProps) => {
  const entityTypes = Object.keys(entities);

  // Enhanced entity categorization
  const categorizedEntities = {
    "Proper Names": [] as string[],
    "Individuals": [] as string[],
    "Law Firms and Legal Entities": [] as string[],
    "Case Information": [] as string[],
    "Cause Number": [] as string[],
    "Court Information": [] as string[],
    "Locations": [] as string[],
    "Contact Information": [] as string[],
    "Other": [] as string[],
  };

  // Process and categorize entities
  const processEntities = () => {
    // Extract people names
    if (entities["People"] || entities["PERSON"]) {
      const people = [...(entities["People"] || []), ...(entities["PERSON"] || [])];
      categorizedEntities["Individuals"] = people;
      categorizedEntities["Proper Names"] = [...categorizedEntities["Proper Names"], ...people];
    }

    // Extract organizations
    if (entities["Organizations"] || entities["ORG"]) {
      const orgs = [...(entities["Organizations"] || []), ...(entities["ORG"] || [])];
      categorizedEntities["Law Firms and Legal Entities"] = orgs;
      categorizedEntities["Proper Names"] = [...categorizedEntities["Proper Names"], ...orgs];
    }

    // Extract case numbers
    if (entities["CASE"] || entities["Cases"]) {
      const cases = [...(entities["CASE"] || []), ...(entities["Cases"] || [])];
      categorizedEntities["Cause Number"] = cases;
      categorizedEntities["Case Information"] = [...categorizedEntities["Case Information"], ...cases];
    }

    // Extract courts
    if (entities["COURT"] || entities["Courts"]) {
      const courts = [...(entities["COURT"] || []), ...(entities["Courts"] || [])];
      categorizedEntities["Court Information"] = [...categorizedEntities["Court Information"], ...courts];
    }

    // Extract locations
    if (entities["GPE"] || entities["Locations"]) {
      categorizedEntities["Locations"] = [...(entities["GPE"] || []), ...(entities["Locations"] || [])];
    }

    // Extract dates and add to case information
    if (entities["DATE"] || entities["Dates"]) {
      const dates = [...(entities["DATE"] || []), ...(entities["Dates"] || [])];
      categorizedEntities["Case Information"] = [...categorizedEntities["Case Information"], ...dates];
    }

    // Extract legal terms
    if (entities["LAW"] || entities["Legal Terms"]) {
      const laws = [...(entities["LAW"] || []), ...(entities["Legal Terms"] || [])];
      categorizedEntities["Other"] = [...categorizedEntities["Other"], ...laws];
    }
  };

  processEntities();

  // Remove empty categories
  Object.keys(categorizedEntities).forEach(key => {
    if (categorizedEntities[key as keyof typeof categorizedEntities].length === 0) {
      delete categorizedEntities[key as keyof typeof categorizedEntities];
    }
  });

  if (entityTypes.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 h-full flex items-center justify-center">
        <div>
          <h3 className="text-lg font-medium">No entities were found in this transcript</h3>
          <p className="mt-2">Process a transcript with entity extraction enabled to see results</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ScrollArea className="h-full pr-4">
        <div className="space-y-6">
          {Object.keys(categorizedEntities).map((category) => (
            <Card key={category} className="h-auto">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{category}</CardTitle>
                <CardDescription>
                  {categorizedEntities[category as keyof typeof categorizedEntities].length} {
                    categorizedEntities[category as keyof typeof categorizedEntities].length === 1 ? "entry" : "entries"
                  } found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {category === "Proper Names" || category === "Individuals" ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {categorizedEntities[category as keyof typeof categorizedEntities].map((entity, index) => (
                      <li key={index} className="text-sm">
                        {entity}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categorizedEntities[category as keyof typeof categorizedEntities].map((entity, index) => (
                      <Badge key={index} variant="secondary" className="bg-slate-100 text-slate-800">
                        {entity}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Show original entity categories */}
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
        </div>
      </ScrollArea>
    </div>
  );
};
