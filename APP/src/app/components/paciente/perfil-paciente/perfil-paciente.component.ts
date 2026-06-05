import { Component } from '@angular/core';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AuthService } from '../../../services/auth/auth.service';
import { OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { routeAnimations } from '../../../animations/animations';
import { AppointmentsService } from '../../../services/appointments/appointments.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-perfil-paciente',
  standalone: true,
  imports: [SidebarComponent,CommonModule],
  templateUrl: './perfil-paciente.component.html',
  styleUrl: './perfil-paciente.component.css',
  animations: [routeAnimations]
})

export class PerfilPacienteComponent implements OnInit {
  userData: any;

  constructor(
    private authService: AuthService,
    private appointmentsService: AppointmentsService
  ) {}

  ngOnInit(): void {
    this.authService.getUser()
    this.userData = this.authService.getUserData();
  }

  async downloadMedicalHistoryPdf(): Promise<void> {
    if (!this.userData?.uid) {
      await Swal.fire('No disponible', 'No se pudo obtener el usuario actual.', 'info');
      return;
    }

    try {
      await this.appointmentsService.generateMedicalHistoryPdfByUserId(this.userData.uid);
      await Swal.fire('PDF generado', 'La historia clínica se descargó correctamente.', 'success');
    } catch (error) {
      console.error('Error al generar la historia clínica:', error);
      const message = error instanceof Error && error.message === 'No medical history found for this user'
        ? 'Todavía no tenés historia clínica registrada.'
        : 'No se pudo generar la historia clínica.';
      await Swal.fire('Error', message, 'error');
    }
  }
}
