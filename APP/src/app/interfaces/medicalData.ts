export interface MedicalData {
    height: number;
    weight: number;
    temperature: number;
    pressure: string; 
    behavior: number;
    generalState: number; 
    secondVisitRecommendation: string; 
    dynamicData: Array<{ key: string; value: number }>;
}