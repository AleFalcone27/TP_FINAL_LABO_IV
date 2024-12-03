export interface DynamicData {
    key: string;
    value: number;
}

export interface MedicalHistory {
    id: string;
    height: number;
    weight: number;
    patientLastName: string
    patientFirstName: string,
    doctorFirstName: string,
    doctorLastName: string,
    secondVisitRecommendation: string,
    patientBehavior: any,
    patientGeneralState: any,
    dynamicData: DynamicData[]; 
    patientUID: string;
    date: {
        seconds: number; 
        nanoseconds: number; 
    };
    appointmentId: string;
    pressure: string; 
}