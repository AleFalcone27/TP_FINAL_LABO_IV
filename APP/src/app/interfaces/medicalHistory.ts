export interface DynamicData {
    key: string;
    value: string;
}

export interface MedicalHistory {
    id: string;
    height: number;
    temperature?: number;
    weight: number;
    patientLastName: string
    patientFirstName: string,
    doctorFirstName: string,
    doctorLastName: string,
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
