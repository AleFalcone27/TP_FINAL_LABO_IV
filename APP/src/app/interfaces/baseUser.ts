export interface BaseUser {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  }
  
  export interface Patient extends BaseUser {
    role: 'user';
    dni: string;
    socialInsurance: string;
  }
  
  export interface Doctor extends BaseUser {
    role: 'doctor';
    specialty: string;
    approved: boolean;
  }
  
  export interface Admin extends BaseUser {
    role: 'admin';
  }
  
  export type User = Patient | Doctor | Admin;