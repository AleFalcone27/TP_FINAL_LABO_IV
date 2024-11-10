import { Timestamp } from "firebase/firestore";

export interface Admin {
    age: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    uid: string;
  }