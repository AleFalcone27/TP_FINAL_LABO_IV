import { Timestamp } from "firebase/firestore";

export interface Admin {
    age: number;
    email: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    role: string;
    uid: string;
  }
