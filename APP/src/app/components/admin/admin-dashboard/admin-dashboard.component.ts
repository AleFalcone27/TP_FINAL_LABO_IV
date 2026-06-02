import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { SpinnerComponent } from "../../spinner/spinner.component";
import { UsersTableComponent } from '../users-table/users-table.component';
import { RegisterAdminComponent } from '../../register/register-admin/register-admin.component';
import { CommonModule } from '@angular/common';
import { RegisterPacienteComponent } from "../../register/register-paciente/register-paciente.component";
import { RegisterEspecialistaComponent } from '../../register/register-especialista/register-especialista.component';
import { CaptchaService } from '../../../services/captcha/captcha.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [SidebarComponent, SpinnerComponent, UsersTableComponent, RegisterAdminComponent, CommonModule, RegisterPacienteComponent, RegisterEspecialistaComponent, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  selectedRole: string | null = null;
  captchaEnabled: boolean = true;

  constructor(private configService: CaptchaService) {}

  ngOnInit(): void {
    this.loadCaptchaConfig();
  }

  async loadCaptchaConfig(): Promise<void> {
    this.captchaEnabled = this.configService.getCaptchaEnabled();
    this.configService.captchaEnabled$.subscribe(enabled => {
      this.captchaEnabled = enabled;
    });
  }

  async toggleCaptcha(): Promise<void> {
    try {
      await this.configService.setCaptchaEnabled(this.captchaEnabled);
      Swal.fire({
        title: '¡Configuración actualizada!',
        text: `El captcha ha sido ${this.captchaEnabled ? 'activado' : 'desactivado'} correctamente.`,
        icon: 'success',
        confirmButtonText: 'Ok',
        timer: 2000
      });
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo actualizar la configuración del captcha.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    }
  }

  setRole(role: string): void {
    this.selectedRole = role;
  }

}
