import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentsService } from '../../../services/appointments/appointments.service';
import { SpinnerComponent } from '../../spinner/spinner.component';
import { Firestore, collection, addDoc, doc, query, where, getDocs } from '@angular/fire/firestore';
import { FormatDatePipe } from '../../../pipes/format-date-pipe/format-date.pipe';
import { Timestamp } from '@angular/fire/firestore';
import { FormatHourPipe } from '../../../pipes/format-hour/format-hour.pipe';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Specialties } from '../../../interfaces/appointment';
import { SpecialtyDetails } from '../../../interfaces/appointment';
import { Schedule } from '../../../interfaces/appointment';
import { UserService } from '../../../services/users/users.service';
import { User } from '../../../interfaces/user';

@Component({
  selector: 'app-make-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent, FormatDatePipe, FormatHourPipe],
  templateUrl: './make-appointment.component.html',
  styleUrls: ['./make-appointment.component.css']
})
export class MakeAppointmentComponent implements OnInit {
  readonly fallbackSpecialtyImage = 'https://pdxwznmonhqdpvxpadpa.supabase.co/storage/v1/object/public/other/logo.png';
  private readonly specialtyImageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif'];

  specialties: { especialidad: string; image: string }[] = [];
  doctors: any[] = [];
  availableSlots: Date[] = [];
  selectedDoctor: any;
  selectedSpecialty!: string;
  groupedSlots: { date: string; slots: Date[] }[] = [];
  isOpen: { [key: string]: boolean } = {};
  reservedSlots: Date[] = [];
  selectedSpecialtyLabel = '';
  selectedDoctorLabel = '';
  patients: User[] = [];
  selectedPatientUid = '';
  selectedPatient: User | null = null;
  selectedPatientLabel = '';
  isAdminBooking = false;

  loadingMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private appointmentsService: AppointmentsService,
    private userService: UserService,
    private firestore: Firestore,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    this.isAdminBooking = this.authService.getRole() === 'admin';

    if (this.isAdminBooking) {
      await this.loadPatients();
    }

    await this.loadSpecialties();
  }

  async loadPatients(): Promise<void> {
    try {
      this.loadingMessage = 'Cargando pacientes...';
      this.isLoading = true;
      this.patients = (await this.userService.getUsers())
        .sort((a, b) => this.getPatientFullName(a).localeCompare(this.getPatientFullName(b)));
    } catch (error) {
      console.error('Error al cargar los pacientes:', error);
    } finally {
      this.loadingMessage = 'cargando...';
      this.isLoading = false;
    }
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

  getSpecialtyImageSource(specialty: { especialidad: string; image: string }): string {
    return specialty.image || this.buildSpecialtyImageCandidates(specialty.especialidad)[0] || this.fallbackSpecialtyImage;
  }

  onSpecialtyImageError(event: Event, specialtyName: string): void {
    const image = event.target as HTMLImageElement;
    const candidates = this.buildSpecialtyImageCandidates(specialtyName);
    const currentSource = image.currentSrc || image.src;
    const currentIndex = candidates.findIndex(candidate => currentSource.includes(candidate));
    const nextIndex = currentIndex + 1;

    if (nextIndex >= 0 && nextIndex < candidates.length) {
      image.src = candidates[nextIndex];
      return;
    }

    image.onerror = null;
    image.src = this.fallbackSpecialtyImage;
  }

  private buildSpecialtyImageCandidates(specialtyName: string): string[] {
    const slug = this.normalizeSpecialtyName(specialtyName);
    const baseUrl = 'https://pdxwznmonhqdpvxpadpa.supabase.co/storage/v1/object/public/other';
    const candidates = this.specialtyImageExtensions.flatMap(extension => ([
      `${baseUrl}/${slug}.${extension}`,
      `${baseUrl}/especialidades/${slug}.${extension}`
    ]));

    return Array.from(new Set(candidates));
  }

  private normalizeSpecialtyName(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  toggleSlots(date: string): void {
    this.isOpen[date] = !this.isOpen[date];
  }

  async selectSpecialty(specialty: string): Promise<void> {
    try {
      this.loadingMessage = 'Cargando especialistas...';
      this.isLoading = true;
      this.selectedSpecialty = specialty;
      this.selectedSpecialtyLabel = specialty;
      this.selectedDoctor = null;
      this.selectedDoctorLabel = '';
      this.availableSlots = [];
      this.groupedSlots = [];
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

    const querySnapshot = await getDocs(query(appointmentsCollection, where('uidDoctor', '==', doctorId),where('date', '>=', Timestamp.fromDate(startDate)), where('date', '<=', Timestamp.fromDate(endDate))));

    querySnapshot.forEach(doc => {
      const data = doc.data();
      reservedSlots.push(data['date'].toDate());
    });

    console.log(reservedSlots)
    return reservedSlots;

  }

  async selectDoctor(doctor: any): Promise<void> {
    this.selectedDoctor = doctor;
    this.selectedDoctorLabel = `${doctor.firstName} ${doctor.lastName}`;
    await this.loadAvailableSlots(doctor.uid);
  }

  async loadAvailableSlots(doctorId: string): Promise<void> {
    try {
        this.loadingMessage = 'Obteniendo turnos disponibles...';
        this.isLoading = true;

        // Aquí está la corrección: desestructuramos el objeto correctamente
        const { Specialties } = await this.appointmentsService.getDoctorDetails(doctorId);
;
        console.log(Specialties[this.selectedSpecialty]);


        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + 15);

        const reservedSlots = await this.loadReservedSlots(doctorId, today, endDate);

        this.availableSlots = this.calculateAvailableSlots(today, endDate, Specialties[this.selectedSpecialty]['AppointmentDuration'], Specialties[this.selectedSpecialty]['Schedule']);

        this.availableSlots = this.availableSlots.filter(slot => 
            !reservedSlots.some(reservedSlot => reservedSlot.getTime() === slot.getTime())
        );

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

  calculateAvailableSlots(startDate: Date, endDate: Date, appointmentDuration: string, schedule: any): Date[] {
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

  async bookAppointment(slot: Date): Promise<void> {
    console.log(slot);

    const patient = this.getAppointmentPatient();
    if (!patient) {
      await Swal.fire({
        icon: 'warning',
        title: 'Seleccioná un paciente',
        text: 'Para reservar un turno como administrador primero tenés que elegir el paciente.',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    this.isLoading = true;
    this.loadingMessage = 'Reservando turno';

    const appointmentData = {
      cancellationComment: '',
      doctorReview: '',
      patientSurvey: {
        knowledgeRating: 0,
        conformeRating: ''
      },
      stars: '',
      specialty: this.selectedSpecialty,
      uidDoctor: this.selectedDoctor.uid,
      doctorFirstName: this.selectedDoctor.firstName,
      doctorLastName: this.selectedDoctor.lastName,
      doctorSpecialties: this.selectedDoctor.specialties || Object.keys(this.selectedDoctor.Specialties || {}),
      patientFirstName: patient.firstName,
      patientLastName: patient.lastName,
      uidPatient: patient.uid,
      date: Timestamp.fromDate(slot),
      status: 0,
    };

    const appointmentsCollection = collection(this.firestore, 'appointments');
    try {
      await addDoc(appointmentsCollection, appointmentData);
      console.log('Turno reservado con éxito:', appointmentData);
      this.selectedDoctor = null;
      this.selectedDoctorLabel = '';
      this.availableSlots = [];
      this.groupedSlots = [];
      this.isLoading = false;
      this.loadingMessage = '';

      await Swal.fire({
        icon: 'success',
        title: '¡Turno reservado!',
        text: this.isAdminBooking ? 'El turno ha sido reservado con éxito.' : 'Tu turno ha sido reservado con éxito.',
        confirmButtonText: 'Aceptar'
      });

      await this.router.navigate([this.isAdminBooking ? '/admin/turnos' : '/paciente/misTurnos']);
    } catch (error) {
      console.error('Error al reservar el turno:', error);
      this.isLoading = false;
      this.loadingMessage = '';

      await Swal.fire({
        icon: 'error',
        title: 'Error al reservar el turno',
        text: 'Ocurrió un error al intentar reservar tu turno. Por favor, inténtalo de nuevo.',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      this.isLoading = false;
      this.loadingMessage = '';
    }
  }

  hasSpecialtySelection(): boolean {
    return !!this.selectedSpecialty;
  }

  hasPatientSelection(): boolean {
    return !this.isAdminBooking || !!this.selectedPatient;
  }

  hasDoctorSelection(): boolean {
    return !!this.selectedDoctor;
  }

  hasSlots(): boolean {
    return this.groupedSlots.length > 0;
  }

  onPatientChange(patientUid: string): void {
    this.selectedPatientUid = patientUid;
    this.selectedPatient = this.patients.find(patient => patient.uid === this.selectedPatientUid) || null;
    this.selectedPatientLabel = this.selectedPatient ? this.getPatientFullName(this.selectedPatient) : '';
    this.clearBookingSelection();
  }

  private getAppointmentPatient(): Pick<User, 'firstName' | 'lastName' | 'uid'> | null {
    if (this.isAdminBooking) {
      return this.selectedPatient;
    }

    const user = this.authService.getUserData();
    return {
      firstName: user['firstName'],
      lastName: user['lastName'],
      uid: user['uid']
    };
  }

  private clearBookingSelection(): void {
    this.selectedSpecialty = '';
    this.selectedSpecialtyLabel = '';
    this.selectedDoctor = null;
    this.selectedDoctorLabel = '';
    this.availableSlots = [];
    this.groupedSlots = [];
    this.isOpen = {};
  }

  private getPatientFullName(patient: User): string {
    return `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.email;
  }
}
