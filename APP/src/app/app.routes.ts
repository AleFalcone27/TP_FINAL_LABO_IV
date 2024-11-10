import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { RegisterPacienteComponent } from './components/register/register-paciente/register-paciente.component';
import { RegisterEspecialistaComponent } from './components/register/register-especialista/register-especialista.component';
import { RegisterPageEspecialistaComponent } from './components/register/register-page-especialista/register-page-especialista.component';
import { RegisterPagePacienteComponent } from './components/register/register-page-paciente/register-page-paciente.component';
import { LoginComponent } from './components/login/login.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { RegisterComponent } from './components/register/register/register.component';

export const routes: Routes = [

    { path: '', redirectTo: '/home', pathMatch:'full' },
    { path: 'home', component: HomeComponent },
    { path: 'registerpaciente', component: RegisterPagePacienteComponent },
    { path: 'registerespecialista', component: RegisterPageEspecialistaComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'login', component:LoginComponent },
    { path: 'admin', component:AdminDashboardComponent }

];
