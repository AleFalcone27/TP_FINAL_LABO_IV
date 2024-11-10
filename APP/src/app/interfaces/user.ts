import { Timestamp } from "firebase/firestore";

export interface User {
    age: number;
    dni: string
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    socialInsurance: string;
    uid: string;
  }