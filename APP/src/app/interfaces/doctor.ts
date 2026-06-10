import { Timestamp } from "firebase/firestore";

export interface Doctor {
    age: number;
    email: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    role: string;
    profileImage1: string;
    specialty: string;
    approved: boolean;
    uid: string;
  }
