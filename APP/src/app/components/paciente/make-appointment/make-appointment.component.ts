import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AuthService } from '../../../services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { AppointmentsService } from '../../../services/appointments/appointments.service';
import { SpinnerComponent } from '../../spinner/spinner.component';
import { Firestore, collection, addDoc, doc, query, where, getDocs } from '@angular/fire/firestore';
import { FormatDatePipe } from '../../../pipes/format-date-pipe/format-date.pipe';
import { Timestamp } from '@angular/fire/firestore';
import { FormatHourPipe } from '../../../pipes/format-hour/format-hour.pipe';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-make-appointment',
  standalone: true,
  imports: [SidebarComponent, CommonModule, SpinnerComponent, FormatDatePipe, FormatHourPipe],
  templateUrl: './make-appointment.component.html',
  styleUrls: ['./make-appointment.component.css']
})
export class MakeAppointmentComponent implements OnInit {

  specialties: { especialidad: string; image: string }[] = [];
  doctors: any[] = [];
  availableSlots: Date[] = [];
  selectedDoctor: any;
  groupedSlots: { date: string; slots: Date[] }[] = [];
  isOpen: { [key: string]: boolean } = {};
  reservedSlots: Date[] = [];

  loadingMessage = '';
  isLoading = false;

  constructor(private authService: AuthService, private appointmentsService: AppointmentsService, private firestore: Firestore) { }

  ngOnInit(): void {
    this.loadSpecialties();
  }

  async loadSpecialties(): Promise<void> {
    try {
      this.loadingMessage = 'Cargando especialidades...';
      this.isLoading = true;
      this.specialties = await this.appointmentsService.getSpecialties();
      console.log('Especialidades cargadas:', this.specialties);
    } catch (error) {
      console.error('Error al cargar las especialidades:', error);
    }
    this.loadingMessage = 'cargando...';
    this.isLoading = false;
  }

  toggleSlots(date: string): void {
    this.isOpen[date] = !this.isOpen[date];
  }

  async selectSpecialty(specialty: string): Promise<void> {
    try {
      this.loadingMessage = 'Cargando especialistas...';
      this.isLoading = true;
      console.log('Especialidad seleccionada:', specialty);
      this.doctors = await this.appointmentsService.getDoctorsBySpecialty(specialty);
      console.log('Doctores encontrados:', this.doctors);
    } catch (error) {
      console.error('Error al cargar los doctores:', error);
    }
    this.loadingMessage = 'cargando...';
    this.isLoading = false;
  }

  async loadReservedSlots(doctorId: string, startDate: Date, endDate: Date): Promise<Date[]> {
    const reservedSlots: Date[] = [];
    const appointmentsCollection = collection(this.firestore, 'appointments');

    const querySnapshot = await getDocs(query(appointmentsCollection, where('uidDoctor', '==', doctorId), where('date', '>=', Timestamp.fromDate(startDate)), where('date', '<=', Timestamp.fromDate(endDate))));

    querySnapshot.forEach(doc => {
      const data = doc.data();
      reservedSlots.push(data['date'].toDate());
    });

    return reservedSlots;
  }

  async selectDoctor(doctor: any): Promise<void> {
    this.selectedDoctor = doctor;
    await this.loadAvailableSlots(doctor.uid);
  }

  async loadAvailableSlots(doctorId: string): Promise<void> {
    try {
      this.loadingMessage = 'Obteniendo turnos disponibles...';
      this.isLoading = true;

      const { AppointmentDuration, Schedule } = await this.appointmentsService.getDoctorDetails(doctorId);

      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 15);

      const reservedSlots = await this.loadReservedSlots(doctorId, today, endDate);

      this.availableSlots = this.calculateAvailableSlots(today, endDate, AppointmentDuration, Schedule);

      this.availableSlots = this.availableSlots.filter(slot => !reservedSlots.some(reservedSlot => reservedSlot.getTime() === slot.getTime()));

      this.groupedSlots = this.groupSlotsByDate(this.availableSlots);

      console.log('Turnos disponibles:', this.availableSlots);
    } catch (error) {
      console.error('Error al cargar los turnos disponibles:', error);
    } finally {
      this.loadingMessage = 'Cargando...';
      this.isLoading = false;
    }
  }

  private groupSlotsByDate(slots: Date[]): { date: string; slots: Date[] }[] {
    const grouped: { [key: string]: Date[] } = {};

    slots.forEach(slot => {
      const dateString = new Date(slot).toDateString();
      if (!grouped[dateString]) {
        grouped[dateString] = [];
      }
      grouped[dateString].push(slot);
    });

    return Object.keys(grouped).map(date => ({ date, slots: grouped[date] }));
  }

  isSlotReserved(slot: Date): boolean {
    return this.reservedSlots ? this.reservedSlots.some(reservedSlot => reservedSlot.getTime() === slot.getTime()) : false;
  }

  calculateAvailableSlots(startDate: Date, endDate: Date, appointmentDuration: number, schedule: any): Date[] {
    const availableSlots: Date[] = [];
    const daysOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];


    const appointmentDurationInMinutes: number = this.timeToMinutes(appointmentDuration.toString());

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayName = daysOfWeek[date.getDay()];
      const dailySchedule = schedule[dayName];

      if (dailySchedule) {
        const startTime = this.parseTime(dailySchedule.start, date);
        const endTime = this.parseTime(dailySchedule.end, date);

        const adjustedEndTime = new Date(endTime);
        adjustedEndTime.setHours(14, 30, 0, 0);

        for (let slotStart = new Date(startTime); slotStart < adjustedEndTime; slotStart.setMinutes(slotStart.getMinutes() + 30)) {
          const slotEnd = new Date(slotStart.getTime());
          slotEnd.setMinutes(slotEnd.getMinutes() + appointmentDurationInMinutes);
          if (slotEnd <= adjustedEndTime) {
            availableSlots.push(new Date(slotStart));
          }
        }

        const lastSlotStart = new Date(adjustedEndTime);
        lastSlotStart.setMinutes(lastSlotStart.getMinutes() - appointmentDurationInMinutes);
        if (lastSlotStart >= startTime && lastSlotStart < adjustedEndTime) {
          if (lastSlotStart.getHours() === 13 && lastSlotStart.getMinutes() === 30) {
            availableSlots.push(lastSlotStart);
          }
        }
      }
    }

    return availableSlots;
  }

  parseTime(timeString: string, date: Date): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
  }

  timeToMinutes(duration: string): number {
    const parts = duration.split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }

  bookAppointment(slot: Date): void {
    console.log(slot);

    this.isLoading = true;
    this.loadingMessage = 'Reservando turno';

    let user = this.authService.getUserData();

    const appointmentData = {
      cancellationComment: '',
      doctorReview: '',
      patientSurvey: {
        knowledgeRating: 0,
        conformeRating: ''
      },
      stars: '',
      uidDoctor: this.selectedDoctor.uid,
      doctorFirstName: this.selectedDoctor.firstName,
      doctorLastName: this.selectedDoctor.lastName,
      doctorSpecialties: this.selectedDoctor.specialties,
      patientFirstName: user['firstName'],
      patientLastName: user['lastName'],
      uidPatient: user['uid'],
      date: Timestamp.fromDate(slot),
      status: 0,
    };

    const appointmentsCollection = collection(this.firestore, 'appointments');
    addDoc(appointmentsCollection, appointmentData)
      .then(() => {
        console.log('Turno reservado con éxito:', appointmentData);
        this.isLoading = false;

        Swal.fire({
          icon: 'success',
          title: '¡Turno reservado!',
          text: 'Tu turno ha sido reservado con éxito.',
          confirmButtonText: 'Aceptar'
        });
      })
      .catch(error => {
        console.error('Error al reservar el turno:', error);

        Swal.fire({
          icon: 'error',
          title: 'Error al reservar el turno',
          text: 'Ocurrió un error al intentar reservar tu turno. Por favor, inténtalo de nuevo.',
          confirmButtonText: 'Aceptar'
        });
      });
    this.isLoading = false;
  }
}