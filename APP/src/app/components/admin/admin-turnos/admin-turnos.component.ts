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

  constructor(private authService: AuthService, public appointmentService: AppointmentsService) { }


  async ngOnInit() {
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
      title: 'Cancelar Turno',
      input: 'textarea',
      inputLabel: 'Comentario',
      inputPlaceholder: 'Escribe el motivo de la cancelación...',
      showCancelButton: true,
      confirmButtonText: 'Cancelar Turno',
      cancelButtonText: 'Cancelar',
      preConfirm: (comment) => {
        if (!comment) {
          Swal.showValidationMessage('Por favor, escribe un comentario');
        }
      }
    });

    if (comment) {
      try {
        await this.appointmentService.cancelAppointment(appointment.id, comment); 
        this.loadAppointments(); 
        Swal.fire('Cancelado!', 'Tu turno ha sido cancelado.', 'success');
      } catch (error) {
        console.error('Error cancelando el turno:', error);
        Swal.fire('Error!', 'No se pudo cancelar el turno. Intenta de nuevo.', 'error');
      }
    }
  }


}
