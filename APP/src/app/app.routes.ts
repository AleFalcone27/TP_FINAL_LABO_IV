import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { RegisterPageEspecialistaComponent } from './components/register/register-page-especialista/register-page-especialista.component';
import { RegisterPagePacienteComponent } from './components/register/register-page-paciente/register-page-paciente.component';
import { LoginComponent } from './components/login/login.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { RegisterComponent } from './components/register/register/register.component';
import { PacienteDashboardComponent } from './components/paciente/paciente-dashboard/paciente-dashboard.component';
import { MyAppointmentsComponent } from './components/paciente/my-appointments/my-appointments.component';
import { MakeAppointmentComponent } from './components/paciente/make-appointment/make-appointment.component';
import { PerfilPacienteComponent } from './components/paciente/perfil-paciente/perfil-paciente.component';
import { PerfilEspecialistaComponent } from './components/especialista/perfil-especialista/perfil-especialista.component';
import { MisTurnosEspecialistaComponent } from './components/especialista/mis-turnos-especialista/mis-turnos-especialista.component';
import { AdminTurnosComponent } from './components/admin/admin-turnos/admin-turnos.component';
import { PerfilAdminComponent } from './components/admin/perfil-admin/perfil-admin.component';







export const routes: Routes = [

    { path: '', redirectTo: '/home', pathMatch:'full' },
    { path: 'home', component: HomeComponent },
    { path: 'registerpaciente', component: RegisterPagePacienteComponent },
    { path: 'registerespecialista', component: RegisterPageEspecialistaComponent },
    { path: 'register', component: RegisterComponent },



    { path: 'login', component:LoginComponent },


    // Rutas Admin
    { path: 'admin', component:AdminDashboardComponent },
    { path: 'admin/perfil', component:PerfilAdminComponent },
    { path: 'admin/turnos', component:AdminTurnosComponent },
   

    // Rutas Especialista
    { path: 'especialista/misTurnos', component:MisTurnosEspecialistaComponent },
    { path: 'especialista/perfil', component:PerfilAdminComponent },



    // Rutas Paciente
    { path: 'paciente', component:PacienteDashboardComponent },
    { path: 'paciente/perfil', component:PerfilPacienteComponent },
    { path: 'paciente/misTurnos', component:MyAppointmentsComponent },
    { path: 'paciente/reservarTurno', component:MakeAppointmentComponent }


];
