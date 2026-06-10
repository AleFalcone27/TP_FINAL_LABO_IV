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
import { routeAnimations } from '../../../animations/animations';
import { MedicalHistory } from '../../../interfaces/medicalHistory';


@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [SidebarComponent,SpinnerComponent,CommonModule,FormsModule,FormatAppointmentStatusPipe,AppointmentStatusColorDirective],
  templateUrl: './my-appointments.component.html',
  styleUrl: './my-appointments.component.css',
  animations: [routeAnimations]
})
export class MyAppointmentsComponent {

  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  private medicalHistoriesByAppointmentId = new Map<string, MedicalHistory[]>();
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
      await this.loadMedicalHistories(userId!);
      console.log(this.appointments);
      this.applyFilters();
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadMedicalHistories(userId: string): Promise<void> {
    const histories = await this.appointmentService.getMedicalHistoryByUserID(userId);
    this.medicalHistoriesByAppointmentId.clear();

    for (const history of histories) {
      if (!this.medicalHistoriesByAppointmentId.has(history.appointmentId)) {
        this.medicalHistoriesByAppointmentId.set(history.appointmentId, []);
      }

      this.medicalHistoriesByAppointmentId.get(history.appointmentId)!.push(history);
    }
  }


  applyFilters() {
    let filtered = [...this.appointments].sort((a, b) => b.date.toMillis() - a.date.toMillis());

    if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        filtered = filtered.filter(appointment => this.matchesSearch(appointment, searchLower));
    }

    this.filteredAppointments = filtered;
    console.log(this.filteredAppointments);
}

onSearch(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilters();
}

  private matchesSearch(appointment: Appointment, searchLower: string): boolean {
    const historyMatches = (this.medicalHistoriesByAppointmentId.get(appointment.id) || []).some(history =>
      this.searchableHistoryText(history).includes(searchLower)
    );

    return this.searchableAppointmentText(appointment).includes(searchLower) || historyMatches;
  }

  private searchableAppointmentText(appointment: Appointment): string {
    return [
      appointment.doctorFirstName,
      appointment.doctorLastName,
      appointment.specialty,
      appointment.cancellationComment || '',
      appointment.doctorReview || '',
      this.getTime(appointment.date),
      this.formatDate(appointment.date),
      String(appointment.status)
    ].join(' ').toLowerCase();
  }

  private searchableHistoryText(history: MedicalHistory): string {
    const dynamicData = (history.dynamicData || [])
      .map(data => `${data.key} ${data.value}`)
      .join(' ');

    return [
      history.patientFirstName,
      history.patientLastName,
      history.doctorFirstName,
      history.doctorLastName,
      history.height,
      history.weight,
      history.pressure,
      history.patientBehavior,
      history.patientGeneralState,
      history.date ? this.formatHistoryDate(history.date) : '',
      dynamicData
    ].join(' ').toLowerCase();
  }

  private formatHistoryDate(date: { seconds: number; nanoseconds: number }): string {
    return new Date(date.seconds * 1000).toLocaleDateString();
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
    const existingSurvey = appointment.patientSurvey;
    const { value: formValues } = await Swal.fire({
      title: 'Encuesta de Satisfacción',
      customClass: {
        popup: 'survey-swal-popup',
        title: 'survey-swal-title',
        htmlContainer: 'survey-swal-html',
        confirmButton: 'survey-swal-confirm',
        cancelButton: 'survey-swal-cancel'
      },
      html: `
        <div class="survey-modal">
          <div class="survey-modal-hero">
            <span class="survey-modal-kicker">Feedback del paciente</span>
            <p>Tu opinión nos ayuda a mejorar la atención y la experiencia en cada consulta.</p>
          </div>

          <div class="survey-modal-section">
            <h4>Valoración general</h4>
            <p class="survey-hint">Elegí una calificación rápida para resumir tu experiencia.</p>
            <div class="survey-stars">
            ${[5, 4, 3, 2, 1].map((value) => `
              <label class="survey-star-option">
                <input type="radio" name="overallSatisfaction" value="${value}" ${existingSurvey?.overallSatisfaction === value ? 'checked' : ''}>
                <span>★</span>
              </label>
            `).join('')}
            </div>
          </div>

          <div class="survey-modal-section">
            <h4>Tiempo de espera</h4>
            <div class="survey-field">
              <div class="survey-field-header">
                <label for="waitTime" class="swal-field-label">Del 1 al 10</label>
                <span class="survey-value-badge"><span id="waitTimeValue">${existingSurvey?.waitTimeRating ?? 5}</span>/10</span>
              </div>
              <input id="waitTime" class="swal-range" type="range" min="1" max="10" value="${existingSurvey?.waitTimeRating ?? 5}" />
            </div>
          </div>

          <div class="survey-modal-section">
            <h4>Recomendación</h4>
            <p class="survey-hint">¿Volverías a elegir este profesional?</p>
            <div class="survey-pill-group">
              <label class="survey-pill"><input type="radio" name="wouldRecommend" value="si" ${existingSurvey?.wouldRecommend === 'si' ? 'checked' : ''}><span>Sí</span></label>
              <label class="survey-pill"><input type="radio" name="wouldRecommend" value="no" ${existingSurvey?.wouldRecommend === 'no' ? 'checked' : ''}><span>No</span></label>
            </div>
          </div>

          <div class="survey-modal-section">
            <h4>Aspectos destacados</h4>
            <div class="survey-checkbox-grid">
              <label class="survey-check-card"><input type="checkbox" name="attentionAspects" value="Amabilidad" ${(existingSurvey?.attentionAspects || []).includes('Amabilidad') ? 'checked' : ''}><span>Amabilidad</span></label>
              <label class="survey-check-card"><input type="checkbox" name="attentionAspects" value="Claridad" ${(existingSurvey?.attentionAspects || []).includes('Claridad') ? 'checked' : ''}><span>Claridad</span></label>
              <label class="survey-check-card"><input type="checkbox" name="attentionAspects" value="Rapidez" ${(existingSurvey?.attentionAspects || []).includes('Rapidez') ? 'checked' : ''}><span>Rapidez</span></label>
              <label class="survey-check-card"><input type="checkbox" name="attentionAspects" value="Empatia" ${(existingSurvey?.attentionAspects || []).includes('Empatia') ? 'checked' : ''}><span>Empatía</span></label>
            </div>
          </div>

          <div class="survey-modal-section">
            <h4>Infraestructura y comodidad</h4>
            <label for="facilitiesRating" class="swal-field-label">Del 1 al 10</label>
            <select id="facilitiesRating" class="swal-input">
              ${[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((value) => `
                <option value="${value}" ${existingSurvey?.facilitiesRating === value ? 'selected' : ''}>${value}/10</option>
              `).join('')}
            </select>
          </div>

          <div class="survey-modal-section">
            <h4>Comentario final</h4>
            <label for="comments" class="swal-field-label">Dejanos un texto breve sobre tu experiencia</label>
            <textarea id="comments" class="swal-textarea survey-textarea" maxlength="400" placeholder="Contanos cómo fue tu experiencia...">${existingSurvey?.comments ?? ''}</textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Enviar Encuesta',
      cancelButtonText: 'Cancelar',
      didOpen: () => {
        const waitTimeInput = document.getElementById('waitTime') as HTMLInputElement | null;
        const waitTimeValue = document.getElementById('waitTimeValue') as HTMLSpanElement | null;

        if (waitTimeInput && waitTimeValue) {
          waitTimeInput.oninput = () => {
            waitTimeValue.innerText = waitTimeInput.value;
          };
        }
      },
      preConfirm: () => {
        const overallSatisfaction = Number((document.querySelector('input[name="overallSatisfaction"]:checked') as HTMLInputElement)?.value || 0);
        const wouldRecommend = (document.querySelector('input[name="wouldRecommend"]:checked') as HTMLInputElement)?.value || '';
        const waitTimeRating = Number((document.getElementById('waitTime') as HTMLInputElement)?.value || 0);
        const facilitiesRating = Number((document.getElementById('facilitiesRating') as HTMLSelectElement)?.value || 0);
        const comments = (document.getElementById('comments') as HTMLTextAreaElement)?.value.trim() || '';
        const attentionAspects = Array.from(document.querySelectorAll('input[name="attentionAspects"]:checked'))
          .map((input) => (input as HTMLInputElement).value);

        if (!overallSatisfaction) {
          Swal.showValidationMessage('Por favor, elegí una calificación general.');
          return false;
        }

        if (!wouldRecommend) {
          Swal.showValidationMessage('Por favor, indicá si recomendarías al profesional.');
          return false;
        }

        if (!waitTimeRating || !facilitiesRating) {
          Swal.showValidationMessage('Por favor, completá todos los controles de la encuesta.');
          return false;
        }
        return { overallSatisfaction, wouldRecommend, waitTimeRating, facilitiesRating, attentionAspects, comments };
      }
    });
  
    if (formValues) {
      const { overallSatisfaction, wouldRecommend, waitTimeRating, facilitiesRating, attentionAspects, comments } = formValues;
  
      try {
        await this.appointmentService.submitPatientSurvey(appointment.id, {
          overallSatisfaction,
          wouldRecommend,
          waitTimeRating,
          facilitiesRating,
          attentionAspects,
          comments
        });
        Swal.fire('Gracias!', 'Tu encuesta ha sido enviada.', 'success');
        this.loadAppointments(); 
      } catch (error) {
        console.error('Error enviando la encuesta:', error);
        Swal.fire('Error!', 'No se pudo enviar la encuesta. Intenta de nuevo.', 'error');
      }
    }
  }

  canFillSurvey(appointment: Appointment): boolean {
    return appointment.status === 4 && !appointment.patientSurvey?.overallSatisfaction;
  }

  getTime(date: Timestamp): string {
    const dateObj = date.toDate();
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

}
