export interface MedicalData {
    height: number;
    weight: number;
    temperature: number;
    pressure: string; 
    behavior: number;
    generalState: number; 
    dynamicData: Array<{ key: string; value: string }>;
}
