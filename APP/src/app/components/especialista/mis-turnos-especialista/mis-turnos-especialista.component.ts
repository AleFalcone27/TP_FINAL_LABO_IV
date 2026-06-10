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
import { MedicalData } from '../../../interfaces/medicalData';
import { MedicalHistory } from '../../../interfaces/medicalHistory';
import Swal from 'sweetalert2';
import { routeAnimations } from '../../../animations/animations';

@Component({
  selector: 'app-mis-turnos-especialista',
  standalone: true,
  imports: [SidebarComponent, SpinnerComponent, CommonModule, FormsModule, FormatAppointmentStatusPipe, AppointmentStatusColorDirective],
  templateUrl: './mis-turnos-especialista.component.html',
  styleUrl: './mis-turnos-especialista.component.css',
  animations: [routeAnimations]
})
export class MisTurnosEspecialistaComponent {

  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  private medicalHistoriesByAppointmentId = new Map<string, MedicalHistory[]>();
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
      const userId = this.authService.getUserData()['uid'];
      this.appointments = await this.appointmentService.getAppointmentsByDoctorId(userId!);
      await this.loadMedicalHistories();

      this.applyFilters();
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadMedicalHistories(): Promise<void> {
    this.medicalHistoriesByAppointmentId.clear();

    const uniquePatientIds = [...new Set(this.appointments.map(appointment => appointment.uidPatient).filter(Boolean))];
    const historiesByPatient = await Promise.all(
      uniquePatientIds.map(async (patientId) => ({
        patientId,
        histories: await this.appointmentService.getMedicalHistoryByUserID(patientId)
      }))
    );

    for (const { histories } of historiesByPatient) {
      for (const history of histories) {
        if (!this.medicalHistoriesByAppointmentId.has(history.appointmentId)) {
          this.medicalHistoriesByAppointmentId.set(history.appointmentId, []);
        }
        this.medicalHistoriesByAppointmentId.get(history.appointmentId)!.push(history);
      }
    }
  }

  applyFilters() {
    let filtered = [...this.appointments].sort((a, b) => b.date.toMillis() - a.date.toMillis());

    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(appointment => this.matchesSearch(appointment, searchLower));
    }

    this.filteredAppointments = filtered;
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
      appointment.patientFirstName,
      appointment.patientLastName,
      appointment.specialty,
      appointment.doctorReview || '',
      appointment.cancellationComment || '',
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

  getTime(date: Timestamp): string {
    const dateObj = date.toDate();
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
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

  async downloadPatientHistoryPdf(appointment: Appointment): Promise<void> {
    if (!appointment.uidPatient) {
      await Swal.fire('Error', 'No se pudo obtener el paciente asociado al turno.', 'error');
      return;
    }

    let generated = false;
    let errorMessage = 'No se pudo generar la historia clínica del paciente.';
    try {
      this.isLoading = true;
      this.loadingMessage = 'Generando PDF de historia clínica...';
      await this.appointmentService.generateMedicalHistoryPdfByUserId(appointment.uidPatient);
      generated = true;
    } catch (error) {
      console.error('Error al generar la historia clínica del paciente:', error);
      errorMessage = error instanceof Error && error.message === 'No medical history found for this user'
        ? 'Este paciente todavía no tiene historia clínica registrada.'
        : 'No se pudo generar la historia clínica del paciente.';
    } finally {
      this.isLoading = false;
      this.loadingMessage = '';
    }

    if (generated) {
      await Swal.fire('PDF generado', 'La historia clínica del paciente fue descargada correctamente.', 'success');
      return;
    }

    await Swal.fire('Error', errorMessage, 'error');
  }


  async acceptAppointment(appointment: Appointment) {
    const formattedDate = this.formatDate(appointment.date);

    const result = await Swal.fire({
      title: 'Confirmar Cita',
      text: `¿Está seguro de que desea aceptar la cita para ${formattedDate}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, aceptar',
      cancelButtonText: 'No, cancelar'
    });

    if (result.isConfirmed) {
      try {
        const updated = await this.appointmentService.acceptAppointment(appointment.id);
        if (updated) {
          Swal.fire('Cita Aceptada', 'La cita ha sido aceptada exitosamente.', 'success');
        } else {
          Swal.fire('Error', 'No se pudo actualizar el estado de la cita. Inténtelo de nuevo.', 'error');
        }
      } catch (error) {
        Swal.fire('Error', 'Ocurrió un error al intentar aceptar la cita. Inténtelo de nuevo.', 'error');
        console.error('Error aceptando la cita:', error);
      }
    } else {
      Swal.fire('Cancelado', 'La cita no ha sido aceptada.', 'info');
    }
    this.loadAppointments();
  }



  async endAppointment(appointment: Appointment) {
    const { value: formValues } = await Swal.fire({
      title: 'Finalizar Cita',
      html: `
            <div class="finalize-modal">
              <div class="finalize-modal-hero">
                <span class="finalize-modal-kicker">Registro clínico</span>
                <p>Completá los datos del cierre del turno para guardar la historia médica.</p>
              </div>

              <div class="finalize-modal-section">
                <h4>Observación general</h4>
                <label for="feedback" class="swal-field-label">Comentarios del especialista</label>
                <textarea id="feedback" class="swal-textarea" placeholder="Escribe tus comentarios aquí..."></textarea>
              </div>

              <div class="finalize-modal-section">
                <h4>Signos y medidas</h4>
                <div class="swal-grid">
                  <div class="swal-field">
                    <label for="altura" class="swal-field-label">Altura (cm)</label>
                    <input id="altura" class="swal-input" type="number" placeholder="Ej. 170" />
                  </div>
                  <div class="swal-field">
                    <label for="peso" class="swal-field-label">Peso (kg)</label>
                    <input id="peso" class="swal-input" type="number" placeholder="Ej. 70" />
                  </div>
                  <div class="swal-field">
                    <label for="temperatura" class="swal-field-label">Temperatura (°C)</label>
                    <input id="temperatura" class="swal-input" type="number" placeholder="Ej. 37" />
                  </div>
                  <div class="swal-field">
                    <label for="presion" class="swal-field-label">Presión (mmHg)</label>
                    <input id="presion" class="swal-input" type="text" placeholder="Ej. 120/80" />
                  </div>
                </div>
              </div>

              <div class="finalize-modal-section">
                <h4>Evaluación</h4>
                <div class="swal-field">
                  <label for="comportamiento" class="swal-field-label">Comportamiento del paciente (0-100)</label>
                  <input id="comportamiento" class="swal-range" type="range" min="0" max="100" value="50" />
                </div>
                <div class="swal-field">
                  <label for="estadoGeneral" class="swal-field-label">Estado general del paciente</label>
                  <input id="estadoGeneral" class="swal-input" type="number" placeholder="Ej. 75" />
                </div>
              </div>

              <div class="finalize-modal-section">
                <h4>Datos dinámicos</h4>
                <div class="swal-grid">
                  <div class="swal-field">
                    <label for="dynamicKey1" class="swal-field-label">Dato 1</label>
                    <input id="dynamicKey1" class="swal-input" type="text" placeholder="Ej. caries" />
                  </div>
                  <div class="swal-field">
                    <label for="dynamicValue1" class="swal-field-label">Valor 1</label>
                    <input id="dynamicValue1" class="swal-input" type="text" placeholder="Ej. leve" />
                  </div>
                  <div class="swal-field">
                    <label for="dynamicKey2" class="swal-field-label">Dato 2</label>
                    <input id="dynamicKey2" class="swal-input" type="text" placeholder="Ej. alergia" />
                  </div>
                  <div class="swal-field">
                    <label for="dynamicValue2" class="swal-field-label">Valor 2</label>
                    <input id="dynamicValue2" class="swal-input" type="text" placeholder="Ej. penicilina" />
                  </div>
                  <div class="swal-field">
                    <label for="dynamicKey3" class="swal-field-label">Dato 3</label>
                    <input id="dynamicKey3" class="swal-input" type="text" placeholder="Ej. dolor" />
                  </div>
                  <div class="swal-field">
                    <label for="dynamicValue3" class="swal-field-label">Valor 3</label>
                    <input id="dynamicValue3" class="swal-input" type="text" placeholder="Ej. frecuente" />
                  </div>
                </div>
              </div>
            </div>
        `,
      showCancelButton: true,
      confirmButtonText: 'Finalizar Cita',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'finalize-swal-popup',
        title: 'finalize-swal-title',
        htmlContainer: 'finalize-swal-html',
        confirmButton: 'finalize-swal-confirm',
        cancelButton: 'finalize-swal-cancel'
      },
      preConfirm: () => {
        const feedback = (document.getElementById('feedback') as HTMLTextAreaElement).value;
        const altura = parseInt((document.getElementById('altura') as HTMLInputElement).value);
        const peso = parseInt((document.getElementById('peso') as HTMLInputElement).value);
        const temperatura = parseFloat((document.getElementById('temperatura') as HTMLInputElement).value);
        const presion = (document.getElementById('presion') as HTMLInputElement).value; // Presión se mantiene como string
        const comportamiento = parseInt((document.getElementById('comportamiento') as HTMLInputElement).value);
        const estadoGeneral = parseInt((document.getElementById('estadoGeneral') as HTMLInputElement).value);
        // Obtener datos dinámicos
        const dynamicData = [];
        for (let i = 1; i <= 3; i++) {
          const key = (document.getElementById(`dynamicKey${i}`) as HTMLInputElement).value.trim();
          const value = (document.getElementById(`dynamicValue${i}`) as HTMLInputElement).value.trim();
          if (key && value) {
            dynamicData.push({ key, value });
          }
        }
        if (!feedback || isNaN(altura) || isNaN(peso) || isNaN(temperatura) || !presion || isNaN(estadoGeneral)) {
          Swal.showValidationMessage('Por favor, completa todos los campos requeridos.');
        }
        return { feedback, altura, peso, temperatura, presion, comportamiento, estadoGeneral, dynamicData };
      }
    });

    if (formValues) {
      const { feedback, altura, peso, temperatura, presion, comportamiento, estadoGeneral, dynamicData } = formValues;

      console.log(formValues);

      try {
        await this.appointmentService.endAppointment(appointment, feedback, {
          height: altura,
          weight: peso,
          temperature: temperatura,
          pressure: presion,
          behavior: comportamiento,
          generalState: estadoGeneral,
          dynamicData
        } as MedicalData);
        Swal.fire('Cita Finalizada', 'La historia médica ya está disponible.', 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo finalizar la cita. Inténtelo de nuevo.', 'error');
        console.error('Error finalizando la cita:', error);
      }
    }
    this.loadAppointments();
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
        await this.appointmentService.fillSurvey(appointment.id, Number(knowledge), conforme);
        Swal.fire('Gracias!', 'Tu encuesta ha sido enviada.', 'success');
        this.loadAppointments();
      } catch (error) {
        console.error('Error enviando la encuesta:', error);
        Swal.fire('Error!', 'No se pudo enviar la encuesta. Intenta de nuevo.', 'error');
      }
    }

    const knowledgeInput = document.getElementById('knowledge') as HTMLInputElement;
    const knowledgeValue = document.getElementById('knowledgeValue') as HTMLSpanElement;
    knowledgeInput.oninput = () => {
      knowledgeValue.innerText = knowledgeInput.value;
    };
  }

}
