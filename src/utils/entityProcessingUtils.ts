
/**
 * Utility functions for processing and categorizing legal entities
 */

// Define entity category types
export type EntityCategory = 
  | "Proper Names"
  | "Individuals"
  | "Law Firms and Legal Entities"
  | "Case Information"
  | "Cause Number"
  | "Court Information"
  | "Locations"
  | "Contact Information"
  | "Other";

export type CategorizedEntities = Record<EntityCategory, string[]>;

/**
 * Process and categorize raw entities into meaningful groups
 */
export const processEntities = (entities: Record<string, string[]>): CategorizedEntities => {
  // Initialize categorized entities object
  const categorizedEntities: CategorizedEntities = {
    "Proper Names": [],
    "Individuals": [],
    "Law Firms and Legal Entities": [],
    "Case Information": [],
    "Cause Number": [],
    "Court Information": [],
    "Locations": [],
    "Contact Information": [],
    "Other": [],
  };

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

  // Remove empty categories
  Object.keys(categorizedEntities).forEach(key => {
    if (categorizedEntities[key as EntityCategory].length === 0) {
      delete categorizedEntities[key as EntityCategory];
    }
  });

  return categorizedEntities;
};
