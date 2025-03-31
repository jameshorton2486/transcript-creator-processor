
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ExtractedEntitiesDisplayProps {
  entities: string[];
  onSelectEntity?: (entity: string) => void;
}

export const ExtractedEntitiesDisplay = ({
  entities,
  onSelectEntity
}: ExtractedEntitiesDisplayProps) => {
  if (!entities || entities.length === 0) return null;
  
  // Simple categorization based on patterns
  const categorizeEntities = () => {
    const categories = {
      "Names & People": [] as string[],
      "Organizations": [] as string[],
      "Locations": [] as string[],
      "Case Info": [] as string[],
      "Dates": [] as string[],
      "Other Terms": [] as string[]
    };
    
    entities.forEach(entity => {
      // This is a very basic categorization - could be improved with NLP
      if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(entity) || 
          /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(entity)) {
        categories["Dates"].push(entity);
      }
      else if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(entity)) {
        categories["Names & People"].push(entity);
      }
      else if (/LLC|Inc\.|Corp\.|Corporation|Company|Association/.test(entity)) {
        categories["Organizations"].push(entity);
      }
      else if (/Street|Avenue|Road|Drive|Lane|Blvd|Court|Way|Place|Plaza|Trail|Circle/.test(entity) ||
               /^[A-Z][a-z]+, [A-Z]{2} \d{5}$/.test(entity)) {
        categories["Locations"].push(entity);
      }
      else if (/case|cause|docket|no\.|cv|cr|number|v\.|vs\./.test(entity.toLowerCase())) {
        categories["Case Info"].push(entity);
      }
      else {
        categories["Other Terms"].push(entity);
      }
    });
    
    return categories;
  };
  
  const categorizedEntities = categorizeEntities();
  
  const handleEntityClick = (entity: string) => {
    if (onSelectEntity) {
      onSelectEntity(entity);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Extracted Terms & Entities</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="all">All Entities</TabsTrigger>
            <TabsTrigger value="category">By Category</TabsTrigger>
            <TabsTrigger value="alphabetical">Alphabetical</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="flex flex-wrap gap-2">
              {entities.map((entity, index) => (
                <Badge 
                  key={index} 
                  variant="secondary"
                  className="cursor-pointer hover:bg-slate-200"
                  onClick={() => handleEntityClick(entity)}
                >
                  {entity}
                </Badge>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="category">
            <div className="space-y-4">
              {Object.entries(categorizedEntities).map(([category, items]) => 
                items.length > 0 ? (
                  <div key={category}>
                    <h3 className="text-sm font-medium mb-2">{category}</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {items.map((item, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary"
                          className="cursor-pointer hover:bg-slate-200"
                          onClick={() => handleEntityClick(item)}
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="alphabetical">
            <div className="flex flex-wrap gap-2">
              {[...entities].sort().map((entity, index) => (
                <Badge 
                  key={index} 
                  variant="secondary"
                  className="cursor-pointer hover:bg-slate-200"
                  onClick={() => handleEntityClick(entity)}
                >
                  {entity}
                </Badge>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
