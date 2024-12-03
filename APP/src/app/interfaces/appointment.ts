import { Timestamp } from "firebase/firestore";

export interface Appointment {
    id: string;
    cancellationComment: string,
    doctorReview: string,
    patientSurvey: {
        knowledgeRating: number,
        conformeRating: String
    },
    stars: string,
    date: Timestamp; 
    doctorSpecialties: string[];
    doctorFirstName: string;
    doctorLastName: string;
    status: number; 
    patientFirstName: string
    patientLastName: string
    uidPatient: string;
    uidDoctor: string;
  }
