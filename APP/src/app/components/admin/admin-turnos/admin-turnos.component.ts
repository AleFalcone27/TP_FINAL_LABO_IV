import { Component } from '@angular/core';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AuthService } from '../../../services/auth/auth.service';
import { Appointment } from '../../../interfaces/appointment';
import { AppointmentsService } from '../../../services/appointments/appointments.service';
import { SpinnerComponent } from '../../spinner/spinner.component';
import { CommonModule } from '@angular/common';
import { Timestamp } from 'firebase/firestore';
import { FormsModule } from '@angular/forms';
import { FormatAppointmentStatusPipe } from '../../../pipes/format-appointment-status/format-appointment-status.pipe';
import { AppointmentStatusColorDirective } from '../../../directives/appointment-status-color/appointment-status-color.directive';
import { slideFromBelowAnimation } from '../../../animations/animations';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-turnos',
  standalone: true,
  imports: [SidebarComponent, SpinnerComponent, CommonModule, FormsModule, FormatAppointmentStatusPipe, AppointmentStatusColorDirective],
  templateUrl: './admin-turnos.component.html',
  styleUrl: './admin-turnos.component.css',
  animations: [slideFromBelowAnimation]
})
export class AdminTurnosComponent {

  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  searchTerm: string = '';
  isLoading: boolean = true;
  loadingMessage = '';
  language: 'es' | 'en' | 'pt' = 'es';

  readonly translations = {
    es: {
      title: 'Turnos',
      searchPlaceholder: 'Buscar por especialista, paciente, especialidad...',
      result: 'resultado',
      results: 'resultados',
      date: 'Fecha',
      specialist: 'Especialista',
      patient: 'Paciente',
      specialty: 'Especialidad',
      status: 'Estado',
      actions: 'Acciones',
      cancel: 'Cancelar',
      cancelTitle: 'Cancelar Turno',
      comment: 'Comentario',
      commentPlaceholder: 'Escribe el motivo de la cancelación...',
      cancelConfirm: 'Cancelar Turno',
      cancelButton: 'Cancelar',
      validationComment: 'Por favor, escribe un comentario',
      successTitle: 'Cancelado!',
      successText: 'Tu turno ha sido cancelado.',
      errorTitle: 'Error!',
      errorText: 'No se pudo cancelar el turno. Intenta de nuevo.',
      emptyState: 'No se encontraron turnos que coincidan con la búsqueda.'
    },
    en: {
      title: 'Appointments',
      searchPlaceholder: 'Search by specialist, patient, specialty...',
      result: 'result',
      results: 'results',
      date: 'Date',
      specialist: 'Specialist',
      patient: 'Patient',
      specialty: 'Specialty',
      status: 'Status',
      actions: 'Actions',
      cancel: 'Cancel',
      cancelTitle: 'Cancel Appointment',
      comment: 'Comment',
      commentPlaceholder: 'Write the reason for the cancellation...',
      cancelConfirm: 'Cancel Appointment',
      cancelButton: 'Cancel',
      validationComment: 'Please write a comment',
      successTitle: 'Canceled!',
      successText: 'The appointment has been canceled.',
      errorTitle: 'Error!',
      errorText: 'The appointment could not be canceled. Please try again.',
      emptyState: 'No appointments were found that match the search.'
    },
    pt: {
      title: 'Consultas',
      searchPlaceholder: 'Buscar por especialista, paciente, especialidade...',
      result: 'resultado',
      results: 'resultados',
      date: 'Data',
      specialist: 'Especialista',
      patient: 'Paciente',
      specialty: 'Especialidade',
      status: 'Status',
      actions: 'Ações',
      cancel: 'Cancelar',
      cancelTitle: 'Cancelar consulta',
      comment: 'Comentário',
      commentPlaceholder: 'Escreva o motivo do cancelamento...',
      cancelConfirm: 'Cancelar consulta',
      cancelButton: 'Cancelar',
      validationComment: 'Por favor, escreva um comentário',
      successTitle: 'Cancelado!',
      successText: 'A consulta foi cancelada.',
      errorTitle: 'Erro!',
      errorText: 'Não foi possível cancelar a consulta. Tente novamente.',
      emptyState: 'Nenhuma consulta foi encontrada para a busca.'
    }
  } as const;

  constructor(private authService: AuthService, public appointmentService: AppointmentsService) { }


  async ngOnInit() {
    this.language = this.authService.getLanguage();
    await this.loadAppointments();
  }

  async loadAppointments() {
    try {
      this.isLoading = true;
      this.appointments = await this.appointmentService.getAllAppointments()

      this.applyFilters();
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      this.isLoading = false;
    }
  }

  applyFilters() {
    let filtered = [...this.appointments];

    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(appointment => {
        const specialtiesLower = appointment.doctorSpecialties.map(specialty => specialty.toLowerCase());
        return specialtiesLower.includes(searchLower) ||
          appointment.doctorFirstName.toLowerCase().includes(searchLower) ||
          appointment.doctorLastName.toLowerCase().includes(searchLower) ||
          appointment.patientFirstName.toLowerCase().includes(searchLower) ||
          appointment.patientLastName.toLowerCase().includes(searchLower);
      });
    }

    this.filteredAppointments = filtered;
  }

  onSearch(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  formatDate(date: Timestamp): string {
    const dateObj = date.toDate();
    return dateObj.toLocaleDateString();
  }

  async cancelAppointment(appointment: Appointment) {
    const { value: comment } = await Swal.fire({
      title: this.t.cancelTitle,
      input: 'textarea',
      inputLabel: this.t.comment,
      inputPlaceholder: this.t.commentPlaceholder,
      showCancelButton: true,
      confirmButtonText: this.t.cancelConfirm,
      cancelButtonText: this.t.cancelButton,
      preConfirm: (comment) => {
        if (!comment) {
          Swal.showValidationMessage(this.t.validationComment);
        }
      }
    });

    if (comment) {
      try {
        await this.appointmentService.cancelAppointment(appointment.id, comment); 
        this.loadAppointments(); 
        Swal.fire(this.t.successTitle, this.t.successText, 'success');
      } catch (error) {
        console.error('Error cancelando el turno:', error);
        Swal.fire(this.t.errorTitle, this.t.errorText, 'error');
      }
    }
  }

  get t() {
    return this.translations[this.language];
  }


}
