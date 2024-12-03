import { Timestamp } from "firebase/firestore";

export interface Appointment {
    id: string;
    cancellationComment: string;
    doctorReview: string;
    patientSurvey: {
        knowledgeRating: number;
        conformeRating: string; // Cambiado a string (debería ser 'string' en minúscula)
    };
    specialty: ''; // Aquí se incluye la interfaz Specialties
    stars: string;
    date: Timestamp; 
    doctorSpecialties: string[];
    doctorFirstName: string;
    doctorLastName: string;
    status: number; 
    patientFirstName: string;
    patientLastName: string;
    uidPatient: string;
    uidDoctor: string;
}

export interface Specialties {
    [key: string]: SpecialtyDetails; 
}

export interface SpecialtyDetails {
    AppointmentDuration: string; 
    Schedule: {
        lunes: Schedule;
        martes: Schedule;
        miércoles: Schedule;
        jueves: Schedule;
        viernes: Schedule;
        sábado: Schedule;
        domingo: Schedule;
    };
}

export interface Schedule {
    start: string; 
    end: string;  
}