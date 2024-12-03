import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, Timestamp, query, where, getDocs, getDoc, doc, updateDoc } from '@angular/fire/firestore';
import { Appointment } from '../../interfaces/appointment';
import { MedicalData } from '../../interfaces/medicalData';

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {

  constructor(private firestore: Firestore) { }


  public async getSpecialties(): Promise<{ especialidad: string; image: string }[]> {
    try {
      const specialtiesRef = collection(this.firestore, 'especialidades');
      const querySnapshot = await getDocs(specialtiesRef);
      return querySnapshot.docs.map(doc => ({
        especialidad: doc.data()['especialidad'],
        image: doc.data()['image'],
      }));
    } catch (error) {
      console.error('Error fetching specialties:', error);
      return [];
    }
  }

  async getDoctorsBySpecialty(specialty: string): Promise<any[]> {
    const especialistasRef = collection(this.firestore, 'especialistas');
    const q = query(especialistasRef, where('specialties', 'array-contains', specialty));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async getDoctorDetails(doctorId: string): Promise<{ AppointmentDuration: number; Schedule: { start: string; end: string } }> {
    const doctorsCollection = collection(this.firestore, 'especialistas');

    const q = query(doctorsCollection, where('uid', '==', doctorId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Doctor not found');
    }
    const doctorData = querySnapshot.docs[0].data();

    return {
      AppointmentDuration: doctorData['AppointmentDuration'],
      Schedule: doctorData['Schedule']
    };
  }

  async cancelAppointment(appointmentId: string, comment: string): Promise<void> {
    const appointmentRef = doc(this.firestore, `appointments/${appointmentId}`);

    try {
      await updateDoc(appointmentRef, {
        status: 5,
        cancellationComment: comment,
        cancelledAt: new Date()
      });
    } catch (error) {
      console.error('Error cancelando la cita:', error);
      throw error;
    }
  }

  async getAppointmentsByUserId(userId: string): Promise<Appointment[]> {
    try {
      const collectionRef = collection(this.firestore, 'appointments');
      const q = query(collectionRef, where('uidPatient', '==', userId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();


        return {
          id: doc['id'],
          doctorReview: data['doctorReview'] || "",
          cancellationComment: data['cancellationComment'] || "",
          patientSurvey: {
            knowledgeRating: data['PatientSurvey']?.knowledgeRating || 0,
            conformeRating: data['PatientSurvey']?.conformeRating || ""
          },
          stars: data['stars'] || "0",
          patientFirstName: data['patientFirstName'],
          patientLastName: data['patientLastName'],
          date: data['date'] as Timestamp,
          doctorSpecialties: data['doctorSpecialties'] || [],
          doctorFirstName: data['doctorFirstName'] || "",
          doctorLastName: data['doctorLastName'] || "",
          status: data['status'] || 0,
          uidPatient: data['uidPatient'] || "",
          uidDoctor: data['uidDoctor'] || ""
        } as Appointment;
      });
    } catch (error) {
      console.error('Error al obtener citas:', error);
      return [];
    }
  }

  async getAppointmentsByDoctorId(userId: string): Promise<Appointment[]> {
    try {
      const collectionRef = collection(this.firestore, 'appointments');
      const q = query(collectionRef, where('uidDoctor', '==', userId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();

        return {
          id: doc['id'],
          doctorReview: data['doctorReview'] || "",
          cancellationComment: data['cancellationComment'] || "",
          patientSurvey: {
            knowledgeRating: data['PatientSurvey']?.knowledgeRating || 0,
            conformeRating: data['PatientSurvey']?.conformeRating || ""
          },
          stars: data['stars'] || "0",
          date: data['date'] as Timestamp,
          doctorSpecialties: data['doctorSpecialties'] || [],
          patientFirstName: data['patientFirstName'],
          patientLastName: data['patientLastName'],
          doctorFirstName: data['doctorFirstName'] || "",
          doctorLastName: data['doctorLastName'] || "",
          status: data['status'] || 0,
          uidPatient: data['uidPatient'] || "",
          uidDoctor: data['uidDoctor'] || ""
        } as Appointment;
      });
    } catch (error) {
      console.error('Error al obtener citas:', error);
      return [];
    }
  }

  async rateDoctor(appointmentId: string, rating: number): Promise<void> {
    const appointmentRef = doc(this.firestore, `appointments/${appointmentId}`);

    try {
      await updateDoc(appointmentRef, {
        stars: rating
      });
    } catch (error) {
      console.error('Error guardando la calificación:', error);
      throw error;
    }
  }

  async fillSurvey(appointmentId: string, knowledge: number, conforme: string): Promise<void> {
    const appointmentRef = doc(this.firestore, `appointments/${appointmentId}`);

    try {
      await updateDoc(appointmentRef, {
        patientSurvey: {
          knowledgeRating: knowledge,
          conformeRating: conforme
        },
      });
    } catch (error) {
      console.error('Error guardando la encuesta:', error);
      throw error;
    }
  }

  async getAllAppointments(): Promise<Appointment[]> {
    const appointmentCollectionRef = collection(this.firestore, 'appointments');

    try {
        const querySnapshot = await getDocs(appointmentCollectionRef);
        const appointments = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data() 
        })) as Appointment[];
        
        return appointments; 
    } catch (error) {
        console.error('Error obteniendo las citas:', error);
        return []; 
    }
}


  async acceptAppointment(appointmentId: string): Promise<boolean> {
    const appointmentRef = doc(this.firestore, `appointments/${appointmentId}`);

    try {
      await updateDoc(appointmentRef, {
        status: 1,
      });
      return true;
    } catch (error) {
      console.error('Error aceptando la cita:', error);
      return false;
    }
  }


  async endAppointment(appointment: Appointment, feedback: string, medicalData: MedicalData): Promise<void> {
    const appointmentRef = doc(this.firestore, `appointments/${appointment.id}`);

    try {
        await updateDoc(appointmentRef, {
            status: 4,
            doctorReview: feedback
        });

        if (medicalData.weight === undefined || medicalData.height === undefined || medicalData.pressure === undefined) {
            throw new Error('Uno o más campos de datos médicos son indefinidos.');
        }

        const medicalHistoriesRef = collection(this.firestore, 'medicalHistories');
        await addDoc(medicalHistoriesRef, {
            date: appointment.date,
            appointmentId: appointment.id,
            patientUID: appointment.uidPatient,
            weight: medicalData.weight, 
            height: medicalData.height, 
            pressure: medicalData.pressure, 
            dynamicData: medicalData.dynamicData 
        });

    } catch (error) {
        console.error('Error finalizando la cita:', error);
        throw error; 
    }
}

}




