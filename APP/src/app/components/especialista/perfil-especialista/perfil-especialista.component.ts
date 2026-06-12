import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AuthService } from '../../../services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpinnerComponent } from '../../spinner/spinner.component';
import Swal from 'sweetalert2';
import { AppointmentsService } from '../../../services/appointments/appointments.service';
import { routeAnimations } from '../../../animations/animations';

@Component({
  selector: 'app-perfil-especialista',
  standalone: true,
  imports: [SidebarComponent, CommonModule, FormsModule, SpinnerComponent],
  templateUrl: './perfil-especialista.component.html',
  styleUrls: ['./perfil-especialista.component.css'],
  animations: [routeAnimations]
})
export class PerfilEspecialistaComponent implements OnInit {

  userData: any;
  appointmentDurations: string[] = [];
  schedules: any[] = [];
  weekDays = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miércoles', label: 'Miércoles', legacyKey: 'miercoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sábado', label: 'Sábado', legacyKey: 'sabado' }
  ];
  isLoading = false;
  loadingMessage = '';

  constructor(private authService: AuthService, private appointmentsService: AppointmentsService) { }

  async ngOnInit(): Promise<void> {
    await this.authService.getUser();
    this.userData = this.authService.getUserData();

    if (this.userData?.specialties?.length) {
        this.userData.specialties.forEach((specialty: string, index: number) => {

            console.log(this.userData);

            const appointmentDuration = this.userData.Specialties?.[specialty]?.AppointmentDuration || '';

            this.appointmentDurations[index] = appointmentDuration; 
            this.schedules[index] = this.createEmptySchedule();
        });

        const data = await this.authService.getDoctorSchedule();
        if (data?.Specialties) {
            this.userData.specialties.forEach((specialty: string, index: number) => {
                const specialtySchedule = data['Specialties'][specialty]?.['Schedule'];

                this.schedules[index] = specialtySchedule
                  ? this.createScheduleFromStoredData(specialtySchedule)
                  : this.createEmptySchedule();
            });
        }
    }
}

  async updateAppointmentDuration(): Promise<void> {
    this.isLoading = true;
    this.loadingMessage = 'Actualizando...';

    const schedulesToUpdate = this.schedules.map((schedule, index) => ({
      specialty: this.userData.specialties[index],
      appointmentDuration: this.appointmentDurations[index],
      schedule
    }));



    const validationResults = schedulesToUpdate.map(({ schedule }) => this.validateSchedule(schedule));
    const invalidResult = validationResults.find(result => !result.isValid);

    if (invalidResult) {
      this.isLoading = false;
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: invalidResult.message,
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    await this.authService.updateAppointmentDurations(schedulesToUpdate);
    this.isLoading = false;

    Swal.fire({
      icon: 'success',
      title: 'Éxito',
      text: 'Datos actualizados',
      confirmButtonText: 'Aceptar'
    });
  }

  private validateSchedule(schedule: any): { isValid: boolean, message?: string } {
    const weekdaysRange = { start: '08:00', end: '19:00' };
    const saturdayRange = { start: '08:00', end: '14:00' };

    for (const day in schedule) {
      const { start, end } = schedule[day];

      if (!start || !end) {
        continue;
      }

      if (day === 'sábado') {
        if (!this.isTimeInRange(start, saturdayRange) || !this.isTimeInRange(end, saturdayRange)) {
          return { isValid: false, message: `Los horarios del sábado deben estar entre ${saturdayRange.start} y ${saturdayRange.end}.` };
        }
      } else {
        if (!this.isTimeInRange(start, weekdaysRange) || !this.isTimeInRange(end, weekdaysRange)) {
          return { isValid: false, message: `Los horarios de ${day} deben estar entre ${weekdaysRange.start} y ${weekdaysRange.end}.` };
        }
      }
    }

    return { isValid: true };
  }

  resetForm(): void {
    // Resetear las duraciones de citas
    this.appointmentDurations = this.appointmentDurations.map(() => '');
    
    // Resetear los horarios de cada especialidad
    this.schedules = this.schedules.map(() => this.createEmptySchedule());
  }

  private isTimeInRange(time: string, range: { start: string, end: string }): boolean {
    return time >= range.start && time <= range.end;
  }

  private createEmptySchedule(): any {
    return this.weekDays.reduce((schedule, day) => {
      schedule[day.key] = { start: '', end: '' };
      return schedule;
    }, {} as any);
  }

  private createScheduleFromStoredData(storedSchedule: any): any {
    return this.weekDays.reduce((schedule, day) => {
      const storedDay = storedSchedule[day.key] || (day.legacyKey ? storedSchedule[day.legacyKey] : null) || {};
      schedule[day.key] = {
        start: storedDay.start || '',
        end: storedDay.end || ''
      };
      return schedule;
    }, {} as any);
  }
}
