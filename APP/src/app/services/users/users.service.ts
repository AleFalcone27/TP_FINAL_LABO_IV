// users.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';
import { doc, updateDoc } from '@angular/fire/firestore';
import { User } from '../../interfaces/user';
import { Doctor } from '../../interfaces/doctor';
import { Admin } from '../../interfaces/admin';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private firestore: Firestore) {}

  async getUsers(): Promise<User[]> {
    const usersCol = collection(this.firestore, 'pacientes');
    const snapshot = await getDocs(usersCol);
    return snapshot.docs.map(doc => ({
      ...doc.data() as User,
      id: doc.id
    }));
  }

  async getDoctors(): Promise<Doctor[]> {
    const doctorsCol = collection(this.firestore, 'especialistas');
    const snapshot = await getDocs(doctorsCol);
    return snapshot.docs.map(doc => ({
      ...doc.data() as Doctor,
      id: doc.id
    }));
  }

  async getAdmins(): Promise<Admin[]> {
    const adminsCol = collection(this.firestore, 'administradores');
    const snapshot = await getDocs(adminsCol);
    return snapshot.docs.map(doc => ({
      ...doc.data() as Admin,
      id: doc.id
    }));
  }

  async getAllUsers(): Promise<(User | Doctor | Admin)[]> {
    const [users, doctors, admins] = await Promise.all([
      this.getUsers(),
      this.getDoctors(),
      this.getAdmins()
    ]);
    return [...users, ...doctors, ...admins];
  }

  async updateDoctorStatus(uid: string, newStatus: boolean): Promise<void> {
    try {
      const especialistaRef = collection(this.firestore, 'especialistas');
  
      console.log('Referencia a la colección:', especialistaRef);
      console.log(`Buscando uid: ${uid}`);
  
      const snapshot = await getDocs(query(especialistaRef, where('uid', '==', uid)));
  
      console.log('Documentos encontrados:', snapshot.docs);
  
      if (!snapshot.empty) {
        // Accede al primer documento encontrado
        const docSnapshot = snapshot.docs[0];
  
        // Imprime los datos del documento
        console.log('Datos del documento:', docSnapshot.data());
  
        // Actualiza el estado del doctor
        console.log('Actualizando el estado del doctor...');
        await updateDoc(doc(this.firestore, 'especialistas', docSnapshot.id), 
          { approved: newStatus }
        );
        console.log('Estado del doctor actualizado exitosamente.');
        console.log('Datos del documento:', docSnapshot.data());
      } else {
        console.warn('No se encontraron documentos para el uid proporcionado.');
      }
    } catch (error) {
      console.error('Error updating doctor status in Firestore:', error);
      throw error;
    }
  }

}