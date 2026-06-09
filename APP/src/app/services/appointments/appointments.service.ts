import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, Timestamp, query, where, getDocs, QueryDocumentSnapshot, doc, updateDoc } from '@angular/fire/firestore';
import { Appointment } from '../../interfaces/appointment';
import { MedicalData } from '../../interfaces/medicalData';
import { Specialties } from '../../interfaces/appointment';
import { MedicalHistory } from '../../interfaces/medicalHistory';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {
  constructor(private firestore: Firestore) { }


  public async getSpecialties(): Promise<{ especialidad: string; image: string }[]> {
    try {
      const specialtiesRef = collection(this.firestore, 'especialidades');
      const querySnapshot = await getDocs(specialtiesRef);
      return querySnapshot.docs.map(doc => {
        const especialidad = doc.data()['especialidad'] || '';
        const storedImage = doc.data()['image'] || '';

        return {
          especialidad,
          image: storedImage,
        };
      });
    } catch (error) {
      console.error('Error fetching specialties:', error);
      return [];
    }
  }

  async getApponitmentbySpeciality(): Promise<{ especialidad: string; image?: string }[]> { 
    try {
      const specialtiesRef = collection(this.firestore, 'appointments');
      const querySnapshot = await getDocs(specialtiesRef);
      return querySnapshot.docs.map(doc => ({
        especialidad: doc.data()['specialty'],
      }));

    } catch (error) {
      console.error('Error fetching appointments by specialty:', error);
      return [];
    }
  }

  async getMedicalHistoryByUserID(userId: string): Promise<any[]> {
    try {
      const medicalHistoriesCol = collection(this.firestore, 'medicalHistories');
      const q = query(medicalHistoriesCol, where('patientUID', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const medicalHistories = querySnapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data() 
      }));

      return medicalHistories;

    } catch (error) {
      console.error('Error fetching medical history:', error);
      return []; 
    }
  }

  async getMedicalHistoryByUserId(userId: string): Promise<MedicalHistory[]> {
    return (await this.getMedicalHistoryByUserID(userId)) as MedicalHistory[];
  }

  async generateMedicalHistoryPdfByUserId(userId: string): Promise<void> {
    const histories = await this.getMedicalHistoryByUserId(userId);

    if (!histories.length) {
      throw new Error('No medical history found for this user');
    }

    const patient = histories[0];
    const pdf = new jsPDF();
    const logoDataUrl = await this.loadImageAsDataUrl(
      'https://pdxwznmonhqdpvxpadpa.supabase.co/storage/v1/object/public/other/logo.png'
    );

    pdf.setFontSize(18);
    if (logoDataUrl) {
      pdf.addImage(logoDataUrl, 'PNG', 14, 12, 12, 12);
      pdf.text('Historia Clínica', 30, 20);
    } else {
      pdf.text('Historia Clínica', 14, 20);
    }
    pdf.setFontSize(11);
    pdf.text(`Paciente: ${patient.patientFirstName} ${patient.patientLastName}`, 14, 32);
    pdf.text(`Generado el: ${new Date().toLocaleString()}`, 14, 38);

    autoTable(pdf, {
      startY: 46,
      head: [[
        'Fecha',
        'Doctor',
        'Altura',
        'Peso',
        'Presión',
        'Comportamiento',
        'Estado General',
        'Segunda Visita',
        'Datos Dinámicos'
      ]],
      body: histories.map((history) => ([
        this.formatHistoryDate(history.date),
        `${history.doctorFirstName} ${history.doctorLastName}`,
        `${history.height ?? ''}`,
        `${history.weight ?? ''}`,
        history.pressure ?? '',
        `${history.patientBehavior ?? ''}`,
        `${history.patientGeneralState ?? ''}`,
        `${history.secondVisitRecommendation ?? ''}`,
        this.formatDynamicData(history.dynamicData),
      ])),
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    pdf.save(`clinical-history-${patient.patientUID}.pdf`);
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

  async getDoctorDetails(doctorId: string): Promise<{ Specialties: Specialties }> {
    const doctorsCollection = collection(this.firestore, 'especialistas');

    const q = query(doctorsCollection, where('uid', '==', doctorId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        throw new Error('Doctor not found');
    }
    const doctorData = querySnapshot.docs[0].data();

    const specialties: Specialties = doctorData['Specialties'] || {};

    return { Specialties: specialties };
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
          id: doc.id, // Cambiado a doc.id para obtener el ID del documento
          doctorReview: data['doctorReview'] || "",
          cancellationComment: data['cancellationComment'] || "",
          patientSurvey: {
              knowledgeRating: data['patientSurvey']?.knowledgeRating || 0,
              conformeRating: data['patientSurvey']?.conformeRating || "",
              overallSatisfaction: data['patientSurvey']?.overallSatisfaction,
              wouldRecommend: data['patientSurvey']?.wouldRecommend,
              waitTimeRating: data['patientSurvey']?.waitTimeRating,
              facilitiesRating: data['patientSurvey']?.facilitiesRating,
              attentionAspects: data['patientSurvey']?.attentionAspects || [],
              comments: data['patientSurvey']?.comments || ""
          },
          specialty: data['specialty'], // Asignando specialties directamente
          stars: data['stars'] || "0",
          date: data['date'] as Timestamp, // Asegúrate de que esto sea un Timestamp
          patientFirstName: data['patientFirstName'] || "",
          patientLastName: data['patientLastName'] || "",
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

            // Asumiendo que specialties es un objeto que sigue la estructura definida
            const specialties: Specialties = data['Specialties'] || {};

            return {
                id: doc.id, // Cambiado a doc.id para obtener el ID del documento
                doctorReview: data['doctorReview'] || "",
                cancellationComment: data['cancellationComment'] || "",
                patientSurvey: {
                    knowledgeRating: data['patientSurvey']?.knowledgeRating || 0,
                    conformeRating: data['patientSurvey']?.conformeRating || "",
                    overallSatisfaction: data['patientSurvey']?.overallSatisfaction,
                    wouldRecommend: data['patientSurvey']?.wouldRecommend,
                    waitTimeRating: data['patientSurvey']?.waitTimeRating,
                    facilitiesRating: data['patientSurvey']?.facilitiesRating,
                    attentionAspects: data['patientSurvey']?.attentionAspects || [],
                    comments: data['patientSurvey']?.comments || ""
                },
                specialty: data['specialty'], // Asignando specialties directamente
                stars: data['stars'] || "0",
                date: data['date'] as Timestamp, // Asegúrate de que esto sea un Timestamp
                patientFirstName: data['patientFirstName'] || "",
                patientLastName: data['patientLastName'] || "",
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

  async submitPatientSurvey(
    appointmentId: string,
    survey: {
      overallSatisfaction: number;
      wouldRecommend: string;
      waitTimeRating: number;
      facilitiesRating: number;
      attentionAspects: string[];
      comments: string;
    }
  ): Promise<void> {
    const appointmentRef = doc(this.firestore, `appointments/${appointmentId}`);

    try {
      await updateDoc(appointmentRef, {
        patientSurvey: survey,
        surveyCompletedAt: new Date()
      });
    } catch (error) {
      console.error('Error guardando la encuesta de satisfacción:', error);
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

        console.log({ date: appointment.date,
          appointmentId: appointment.id,
          patientLastName: appointment.patientLastName,
          patientFirstName: appointment.patientFirstName,
          doctorFirstName: appointment.doctorFirstName,
          doctorLastName: appointment.doctorLastName,
          patientUID: appointment.uidPatient,
          weight: medicalData.weight, 
          height: medicalData.height, 
          pressure: medicalData.pressure, 
          dynamicData: medicalData.dynamicData })

        const medicalHistoriesRef = collection(this.firestore, 'medicalHistories');
        await addDoc(medicalHistoriesRef, {
            date: appointment.date,
            appointmentId: appointment.id,
            patientLastName: appointment.patientLastName,
            patientFirstName: appointment.patientFirstName,
            doctorFirstName: appointment.doctorFirstName,
            doctorLastName: appointment.doctorLastName,
            patientUID: appointment.uidPatient,
            secondVisitRecommendation: medicalData.secondVisitRecommendation,
            patientBehavior: medicalData.behavior,
            patientGeneralState: medicalData.generalState,
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

  private formatHistoryDate(date: { seconds: number; nanoseconds: number }): string {
    return new Date(date.seconds * 1000).toLocaleDateString();
  }

  private formatDynamicData(dynamicData: { key: string; value: number }[] = []): string {
    return dynamicData.length
      ? dynamicData.map((item) => `${item.key}: ${item.value}`).join(' | ')
      : '';
  }

  private async loadImageAsDataUrl(url: string): Promise<string | null> {
    try {
      return await new Promise((resolve) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';

        image.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;

          const context = canvas.getContext('2d');
          if (!context) {
            resolve(null);
            return;
          }

          context.drawImage(image, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };

        image.onerror = () => resolve(null);
        image.src = url;
      });
    } catch (error) {
      console.error('Error loading PDF logo:', error);
      return null;
    }
  }
}
