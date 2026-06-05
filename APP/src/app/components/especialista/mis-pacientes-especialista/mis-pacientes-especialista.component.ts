import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Timestamp } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { routeAnimations } from '../../../animations/animations';
import { AppointmentsService } from '../../../services/appointments/appointments.service';
import { AuthService } from '../../../services/auth/auth.service';
import { Appointment } from '../../../interfaces/appointment';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { SpinnerComponent } from '../../spinner/spinner.component';

interface SpecialistPatientRow {
  uidPatient: string;
  patientFirstName: string;
  patientLastName: string;
  lastAppointmentDate: Timestamp;
  appointmentsCount: number;
}

@Component({
  selector: 'app-mis-pacientes-especialista',
  standalone: true,
  imports: [SidebarComponent, SpinnerComponent, CommonModule, FormsModule],
  templateUrl: './mis-pacientes-especialista.component.html',
  styleUrl: './mis-pacientes-especialista.component.css',
  animations: [routeAnimations]
})
export class MisPacientesEspecialistaComponent implements OnInit {
  patients: SpecialistPatientRow[] = [];
  filteredPatients: SpecialistPatientRow[] = [];
  searchTerm = '';
  isLoading = true;
  loadingMessage = 'Cargando pacientes...';
  isGeneratingPdf = false;

  constructor(
    private authService: AuthService,
    private appointmentsService: AppointmentsService
  ) {}

  async ngOnInit() {
    await this.loadPatients();
  }

  async loadPatients() {
    try {
      this.isLoading = true;
      this.loadingMessage = 'Cargando pacientes...';

      const doctorId = this.authService.getUserData()?.uid;
      if (!doctorId) {
        this.patients = [];
        this.filteredPatients = [];
        this.loadingMessage = 'No se pudo obtener el usuario actual.';
        return;
      }

      const appointments = await this.appointmentsService.getAppointmentsByDoctorId(doctorId);
      this.patients = this.groupPatients(appointments);
      this.applyFilters();
    } catch (error) {
      console.error('Error loading patients:', error);
      this.loadingMessage = 'No se pudieron cargar los pacientes.';
    } finally {
      this.isLoading = false;
    }
  }

  private groupPatients(appointments: Appointment[]): SpecialistPatientRow[] {
    const grouped = new Map<string, SpecialistPatientRow>();

    for (const appointment of appointments) {
      if (!appointment.uidPatient) continue;

      const current = grouped.get(appointment.uidPatient);
      if (!current) {
        grouped.set(appointment.uidPatient, {
          uidPatient: appointment.uidPatient,
          patientFirstName: appointment.patientFirstName || '',
          patientLastName: appointment.patientLastName || '',
          lastAppointmentDate: appointment.date,
          appointmentsCount: 1
        });
        continue;
      }

      current.appointmentsCount += 1;
      if (appointment.date.toMillis() > current.lastAppointmentDate.toMillis()) {
        current.lastAppointmentDate = appointment.date;
      }
    }

    return [...grouped.values()].sort((a, b) => b.lastAppointmentDate.toMillis() - a.lastAppointmentDate.toMillis());
  }

  applyFilters() {
    const searchLower = this.searchTerm.trim().toLowerCase();
    if (!searchLower) {
      this.filteredPatients = [...this.patients];
      return;
    }

    this.filteredPatients = this.patients.filter(patient =>
      patient.patientFirstName.toLowerCase().includes(searchLower) ||
      patient.patientLastName.toLowerCase().includes(searchLower) ||
      this.formatDate(patient.lastAppointmentDate).includes(searchLower)
    );
  }

  onSearch(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  formatDate(date: Timestamp): string {
    return date.toDate().toLocaleDateString();
  }

  async downloadMedicalHistoryPdf(patient: SpecialistPatientRow): Promise<void> {
    try {
      this.isGeneratingPdf = true;
      await this.appointmentsService.generateMedicalHistoryPdfByUserId(patient.uidPatient);
      await Swal.fire('PDF generado', 'La historia clínica se descargó correctamente.', 'success');
    } catch (error) {
      console.error('Error al generar la historia clínica:', error);
      const message = error instanceof Error && error.message === 'No medical history found for this user'
        ? 'Este paciente todavía no tiene historia clínica registrada.'
        : 'No se pudo generar la historia clínica.';
      await Swal.fire('Error', message, 'error');
    } finally {
      this.isGeneratingPdf = false;
    }
  }
}
