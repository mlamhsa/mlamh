export type Opportunity = {
    id: string;
    title: string;
    type: "casting" | "commercial" | "film" | "fashion";
    company: string;
    location: string;
    description?: string;
    createdAt: string;
    featured?: boolean;
  };
  
  // TEMP (until DB connected)
  export async function getOpportunities(): Promise<Opportunity[]> {
    return [];
  }