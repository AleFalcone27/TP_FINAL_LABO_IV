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
    let filtered = [...this.appointments];

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
      history.secondVisitRecommendation,
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

    try {
      this.isLoading = true;
      this.loadingMessage = 'Generando PDF de historia clínica...';
      await this.appointmentService.generateMedicalHistoryPdfByUserId(appointment.uidPatient);
      await Swal.fire('PDF generado', 'La historia clínica del paciente fue descargada correctamente.', 'success');
    } catch (error) {
      console.error('Error al generar la historia clínica del paciente:', error);
      await Swal.fire('Error', 'No se pudo generar la historia clínica del paciente.', 'error');
    } finally {
      this.isLoading = false;
      this.loadingMessage = '';
    }
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
            <textarea id="feedback" placeholder="Escribe tus comentarios aquí..." style="width: 100%; height: 100px;"></textarea>
            <br><br>
            <label for="altura">Altura (cm):</label>
            <input id="altura" type="number" placeholder="Ej. 170" style="width: 100%;" />
            <br><br>
            <label for="peso">Peso (kg):</label>
            <input id="peso" type="number" placeholder="Ej. 70" style="width: 100%;" />
            <br><br>
            <label for="temperatura">Temperatura (°C):</label>
            <input id="temperatura" type="number" placeholder="Ej. 37" style="width: 100%;" />
            <br><br>
            <label for="presion">Presión (mmHg):</label>
            <input id="presion" type="text" placeholder="Ej. 120/80" style="width: 100%;" />
            <br><br>
            <label for="comportamiento">Comportamiento del paciente (0-100):</label>
            <input id="comportamiento" type="range" min="0" max="100" value="50" style="width: 100%;" />
            <br><br>
            <label for="estadoGeneral">Estado general del paciente:</label>
            <input id="estadoGeneral" type="number" placeholder="Ej. 75" style="width: 100%;" />
            <br><br>
            <label for="segundaVisita">¿Recomiendas una segunda visita?</label>
            <select id="segundaVisita" style="width: 100%;">
                <option value="Si">Sí</option>
                <option value="No">No</option>
            </select>
            <br><br>
            <label for="dynamicKey1">Dato 1:</label>
            <input id="dynamicKey1" type="text" placeholder="Ej. caries" style="width: 100%;" />
            <label for="dynamicValue1">Valor 1:</label>
            <input id="dynamicValue1" type="number" placeholder="Ej. 4" style="width: 100%;" />
            <br><br>
            <label for="dynamicKey2">Dato 2:</label>
            <input id="dynamicKey2" type="text" placeholder="Ej. alergia" style="width: 100%;" />
            <label for="dynamicValue2">Valor 2:</label>
            <input id="dynamicValue2" type="number" placeholder="Ej. 2" style="width: 100%;" />
            <br><br>
            <label for="dynamicKey3">Dato 3:</label>
            <input id="dynamicKey3" type="text" placeholder="Ej. dolor" style="width: 100%;" />
            <label for="dynamicValue3">Valor 3:</label>
            <input id="dynamicValue3" type="number" placeholder="Ej. 5 " style="width: 100%;" />
        `,
      showCancelButton: true,
      confirmButtonText: 'Finalizar Cita',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const feedback = (document.getElementById('feedback') as HTMLTextAreaElement).value;
        const altura = parseInt((document.getElementById('altura') as HTMLInputElement).value);
        const peso = parseInt((document.getElementById('peso') as HTMLInputElement).value);
        const temperatura = parseFloat((document.getElementById('temperatura') as HTMLInputElement).value);
        const presion = (document.getElementById('presion') as HTMLInputElement).value; // Presión se mantiene como string
        const comportamiento = parseInt((document.getElementById('comportamiento') as HTMLInputElement).value);
        const estadoGeneral = parseInt((document.getElementById('estadoGeneral') as HTMLInputElement).value);
        const segundaVisita = (document.getElementById('segundaVisita') as HTMLSelectElement).value;

        // Obtener datos dinámicos
        const dynamicData = [];
        for (let i = 1; i <= 3; i++) {
          const key = (document.getElementById(`dynamicKey${i}`) as HTMLInputElement).value;
          const value = parseInt((document.getElementById(`dynamicValue${i}`) as HTMLInputElement).value);
          if (key && !isNaN(value)) {
            dynamicData.push({ key, value });
          }
        }
        if (!feedback || isNaN(altura) || isNaN(peso) || isNaN(temperatura) || !presion || isNaN(estadoGeneral)) {
          Swal.showValidationMessage('Por favor, completa todos los campos requeridos.');
        }
        return { feedback, altura, peso, temperatura, presion, comportamiento, estadoGeneral, segundaVisita, dynamicData };
      }
    });

    if (formValues) {
      const { feedback, altura, peso, temperatura, presion, comportamiento, estadoGeneral, segundaVisita, dynamicData } = formValues;

      console.log(formValues);

      try {
        await this.appointmentService.endAppointment(appointment, feedback, {
          height: altura,
          weight: peso,
          temperature: temperatura,
          pressure: presion,
          behavior: comportamiento,
          generalState: estadoGeneral,
          secondVisitRecommendation: segundaVisita,
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
