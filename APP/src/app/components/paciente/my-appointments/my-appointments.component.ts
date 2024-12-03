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
import Swal from 'sweetalert2';


@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [SidebarComponent,SpinnerComponent,CommonModule,FormsModule,FormatAppointmentStatusPipe,AppointmentStatusColorDirective],
  templateUrl: './my-appointments.component.html',
  styleUrl: './my-appointments.component.css'
})
export class MyAppointmentsComponent {

  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  searchTerm: string = '';
  isLoading: boolean = true;
  loadingMessage = '';

  constructor(private authService: AuthService, private appointmentService: AppointmentsService) {}

  async ngOnInit() {
    await this.loadAppointments();
  }

  async loadAppointments() {
    try {
      this.isLoading = true;
      const userId = this.authService.getUserData()['uid'];
      console.log(userId);
      this.appointments = await this.appointmentService.getAppointmentsByUserId(userId!); 
      console.log(this.appointments);
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
                   appointment.doctorLastName.toLowerCase().includes(searchLower);
        });
    }

    this.filteredAppointments = filtered;
    console.log(this.filteredAppointments);
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
      await this.appointmentService.cancelAppointment(appointment.id, comment); // Implementa este método en tu servicio
      this.loadAppointments(); // Recarga las citas después de cancelar
      Swal.fire('Cancelado!', 'Tu turno ha sido cancelado.', 'success');
    } catch (error) {
      console.error('Error cancelando el turno:', error);
      Swal.fire('Error!', 'No se pudo cancelar el turno. Intenta de nuevo.', 'error');
    }
  }
}

  showReview(review: string) {
    Swal.fire({
      title: 'Reseña del Doctor',
      text: review,
      icon: 'info',
      confirmButtonText: 'Aceptar'
    });
  }

  async rateDoctor(appointment: Appointment) {
    const { value: rating } = await Swal.fire({
      title: 'Califica la atención del Doctor',
      input: 'text',
      inputLabel: 'Calificación (1-5)',
      inputPlaceholder: 'Escribe tu calificación...',
      inputValue: appointment.stars,
      showCancelButton: true,
      confirmButtonText: 'Enviar Calificación',
      cancelButtonText: 'Cancelar',
      preConfirm: (rating) => {
        if (!rating || isNaN(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
          Swal.showValidationMessage('Por favor, ingresa una calificación válida (1-5)');
        }
      }
    });
  
    if (rating) {
      try {
        await this.appointmentService.rateDoctor(appointment.id, Number(rating));
        Swal.fire('Gracias!', 'Tu calificación ha sido guardada.', 'success');
        this.loadAppointments(); 
      } catch (error) {
        console.error('Error guardando la calificación:', error);
        Swal.fire('Error!', 'No se pudo guardar la calificación. Intenta de nuevo.', 'error');
      }
    }
  }

  async fillSurvey(appointment: Appointment) {
    const { value: formValues } = await Swal.fire({
      title: 'Encuesta de Satisfacción',
      html: `
        <label for="knowledge">Evalúa los conocimientos del médico (1-50):</label>
        <input id="knowledge" type="range" min="1" max="50" value="25" style="width: 100%;" />
        <span id="knowledgeValue">25</span>
        <br><br>
        <label>¿Estás conforme con la consulta?</label><br>
        <input type="radio" id="conformeYes" name="conforme" value="yes">
        <label for="conformeYes">Sí</label><br>
        <input type="radio" id="conformeNo" name="conforme" value="no">
        <label for="conformeNo">No</label>
      `,
      showCancelButton: true,
      confirmButtonText: 'Enviar Encuesta',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const knowledge = (document.getElementById('knowledge') as HTMLInputElement).value;
        const conforme = (document.querySelector('input[name="conforme"]:checked') as HTMLInputElement)?.value;
        if (!conforme) {
          Swal.showValidationMessage('Por favor, selecciona si estás conforme con la consulta.');
        }
        return { knowledge, conforme };
      }
    });
  
    if (formValues) {
      const { knowledge, conforme } = formValues;
  
      try {
        // Aquí puedes llamar a un método en tu servicio para guardar los resultados de la encuesta
        await this.appointmentService.fillSurvey(appointment.id, Number(knowledge), conforme);
        Swal.fire('Gracias!', 'Tu encuesta ha sido enviada.', 'success');
        this.loadAppointments(); 
      } catch (error) {
        console.error('Error enviando la encuesta:', error);
        Swal.fire('Error!', 'No se pudo enviar la encuesta. Intenta de nuevo.', 'error');
      }
    }
  
    // Actualizar el valor de la barra deslizante en tiempo real
    const knowledgeInput = document.getElementById('knowledge') as HTMLInputElement;
    const knowledgeValue = document.getElementById('knowledgeValue') as HTMLSpanElement;
    knowledgeInput.oninput = () => {
      knowledgeValue.innerText = knowledgeInput.value;
    };
  }

}