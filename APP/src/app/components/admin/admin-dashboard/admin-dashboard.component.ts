import { Component } from '@angular/core';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { SpinnerComponent } from "../../spinner/spinner.component";
import { UsersTableComponent } from '../users-table/users-table.component';
import { RegisterAdminComponent } from '../../register/register-admin/register-admin.component';
import { CommonModule } from '@angular/common';
import { RegisterPacienteComponent } from "../../register/register-paciente/register-paciente.component";
import { RegisterEspecialistaComponent } from '../../register/register-especialista/register-especialista.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [SidebarComponent, SpinnerComponent, UsersTableComponent, RegisterAdminComponent, CommonModule, RegisterPacienteComponent, RegisterEspecialistaComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent {
  selectedRole: string | null = null;

  setRole(role: string): void {
    this.selectedRole = role;
  }

}
