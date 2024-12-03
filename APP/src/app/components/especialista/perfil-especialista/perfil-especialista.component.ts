import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AuthService } from '../../../services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpinnerComponent } from '../../spinner/spinner.component';
import Swal from 'sweetalert2';
import { AppointmentsService } from '../../../services/appointments/appointments.service';

@Component({
  selector: 'app-perfil-especialista',
  standalone: true,
  imports: [SidebarComponent, CommonModule, FormsModule, SpinnerComponent],
  templateUrl: './perfil-especialista.component.html',
  styleUrls: ['./perfil-especialista.component.css']
})
export class PerfilEspecialistaComponent implements OnInit {

  userData: any;
  appointmentDuration: string = '';
  appointmentDurations: string[] = [];
  schedules: any[] = [];
  isLoading = false;
  loadingMessage = '';

  lunesStart: string = '';
  lunesEnd: string = '';
  martesStart: string = '';
  martesEnd: string = '';
  miercolesStart: string = '';
  miercolesEnd: string = '';
  juevesStart: string = '';
  juevesEnd: string = '';
  viernesStart: string = '';
  viernesEnd: string = '';
  sabadoStart: string = '';
  sabadoEnd: string = '';

  constructor(private authService: AuthService, private appointmentsService: AppointmentsService) { }

  async ngOnInit(): Promise<void> {
    this.authService.getUser ();
    this.userData = this.authService.getUserData();

    if (this.userData && this.userData.Specialties) {
        this.userData.specialties.forEach((specialty: string, index: number) => {

            console.log(this.userData);

            const appointmentDuration = this.userData.Specialties[specialty]?.AppointmentDuration || '';

            this.appointmentDurations[index] = appointmentDuration; 
            this.schedules[index] = {
                lunes: { start: '', end: '' },
                martes: { start: '', end: '' },
                miercoles: { start: '', end: '' },
                jueves: { start: '', end: '' },
                viernes: { start: '', end: '' },
                sabado: { start: '', end: '' }
            };
        });

        const data = await this.authService.getDoctorSchedule();
        if (data) {
            this.userData.specialties.forEach((specialty: string, index: number) => {
                const specialtySchedule = data['Specialties'][specialty];

                this.schedules[index] = {
                    lunes: { start: specialtySchedule['Schedule']['lunes']['start'] || '', end: specialtySchedule['Schedule']['lunes']['end'] || '' },
                    martes: { start: specialtySchedule['Schedule']['martes']['start'] || '', end: specialtySchedule['Schedule']['martes']['end'] || '' },
                    miercoles: { start: specialtySchedule['Schedule']['miercoles']['start'] || '', end: specialtySchedule['Schedule']['miercoles']['end'] || '' },
                    jueves: { start: specialtySchedule['Schedule']['jueves']['start'] || '', end: specialtySchedule['Schedule']['jueves']['end'] || '' },
                    viernes: { start: specialtySchedule['Schedule']['viernes']['start'] || '', end: specialtySchedule['Schedule']['viernes']['end'] || '' },
                    sabado: { start: specialtySchedule['Schedule']['sabado']['start'] || '', end: specialtySchedule['Schedule']['sabado']['end'] || '' }
                };
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

    console.log(schedulesToUpdate);

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

      if (day === 'sabado') {
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

  resetFields(): void {
    this.lunesStart = '';
    this.lunesEnd = '';
    this.martesStart = '';
    this.martesEnd = '';
    this.miercolesStart = '';
    this.miercolesEnd = '';
    this.juevesStart = '';
    this.juevesEnd = '';
    this.viernesStart = '';
    this.viernesEnd = '';
    this.sabadoStart = '';
    this.sabadoEnd = '';
  }

  private isTimeInRange(time: string, range: { start: string, end: string }): boolean {
    return time >= range.start && time <= range.end;
  }
}