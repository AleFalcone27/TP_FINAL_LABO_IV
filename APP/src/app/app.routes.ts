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




export const routes: Routes = [

    { path: '', redirectTo: '/home', pathMatch:'full' },
    { path: 'home', component: HomeComponent },
    { path: 'registerpaciente', component: RegisterPagePacienteComponent },
    { path: 'registerespecialista', component: RegisterPageEspecialistaComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'login', component:LoginComponent },

    // Rutas Admin
    { path: 'admin', component:AdminDashboardComponent },


    // Rutas Paciente
    { path: 'paciente', component:PacienteDashboardComponent },
    { path: 'paciente/misTurnos', component:MyAppointmentsComponent },
    { path: 'paciente/reservarTurno', component:MakeAppointmentComponent }


];
