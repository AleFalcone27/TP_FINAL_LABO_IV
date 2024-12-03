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
    this.authService.getUser();
    this.userData = this.authService.getUserData();
    console.log(this.userData);

    if (this.userData && this.userData.AppointmentDuration) {
      this.appointmentDuration = this.userData.AppointmentDuration;
    }

    const data = await this.authService.getDoctorSchedule();

    if (data) {
      this.lunesStart = data['Schedule']['lunes']['start'];
      this.lunesEnd = data['Schedule']['lunes']['end'];
      this.martesStart = data['Schedule']['martes']['start'];
      this.martesEnd = data['Schedule']['martes']['end'];
      this.miercolesStart = data['Schedule']['miercoles']['start'];
      this.miercolesEnd = data['Schedule']['miercoles']['end'];
      this.juevesStart = data['Schedule']['jueves']['start'];
      this.juevesEnd = data['Schedule']['jueves']['end'];
      this.viernesStart = data['Schedule']['viernes']['start'];
      this.viernesEnd = data['Schedule']['viernes']['end'];
      this.sabadoStart = data['Schedule']['sabado']['start'];
      this.sabadoEnd = data['Schedule']['sabado']['end'];
    }
  }

  async updateAppointmentDuration(): Promise<void> {
    this.isLoading = true;
    this.loadingMessage = 'Actualizando...';

    if (this.appointmentDuration) {
      const schedule = {
        lunes: {
          start: this.lunesStart,
          end: this.lunesEnd
        },
        martes: {
          start: this.martesStart,
          end: this.martesEnd
        },
        miércoles: {
          start: this.miercolesStart,
          end: this.miercolesEnd
        },
        jueves: {
          start: this.juevesStart,
          end: this.juevesEnd
        },
        viernes: {
          start: this.viernesStart,
          end: this.viernesEnd
        },
        sábado: {
          start: this.sabadoStart,
          end: this.sabadoEnd
        },
      };


      const validationResult = this.validateSchedule(schedule);
      if (!validationResult.isValid) {
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: validationResult.message,
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      await this.authService.updateAppointmentDuration(this.appointmentDuration, schedule);
      this.isLoading = false;

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Datos actualizados',
        confirmButtonText: 'Aceptar'
      });
    } else {
      this.isLoading = false;
      console.warn('Por favor, ingresa una duración válida.');
    }
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