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
  language: 'es' | 'en' | 'pt' = 'es';
  isLoading = false;

  readonly translations = {
    es: {
      badge: 'Mi perfil',
      greeting: 'Hola, {name}!',
      intro: 'Aquí podés revisar tus datos principales y descargar tu historia clínica cuando la necesites.',
      dataTitle: 'Datos personales',
      firstName: 'Nombre',
      lastName: 'Apellido',
      email: 'Email',
      insurance: 'Obra social',
      historyTitle: 'Historia clínica',
      historyText: 'Descargá un PDF con tus registros médicos para tenerlos siempre a mano.',
      download: 'Descargar historia clínica',
      profileLabel: 'Foto de perfil',
      languageLabel: 'Idioma',
      spanish: 'Español',
      english: 'Inglés',
      portuguese: 'Portugués'
    },
    en: {
      badge: 'My profile',
      greeting: 'Hello, {name}!',
      intro: 'Here you can review your main data and download your medical history whenever you need it.',
      dataTitle: 'Personal data',
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      insurance: 'Insurance',
      historyTitle: 'Medical history',
      historyText: 'Download a PDF with your medical records so you always have them at hand.',
      download: 'Download medical history',
      profileLabel: 'Profile picture',
      languageLabel: 'Language',
      spanish: 'Spanish',
      english: 'English',
      portuguese: 'Portuguese'
    },
    pt: {
      badge: 'Meu perfil',
      greeting: 'Olá, {name}!',
      intro: 'Aqui você pode revisar seus dados principais e baixar seu histórico clínico quando precisar.',
      dataTitle: 'Dados pessoais',
      firstName: 'Nome',
      lastName: 'Sobrenome',
      email: 'E-mail',
      insurance: 'Convênio',
      historyTitle: 'Histórico clínico',
      historyText: 'Baixe um PDF com seus registros médicos para tê-los sempre à mão.',
      download: 'Baixar histórico clínico',
      profileLabel: 'Foto de perfil',
      languageLabel: 'Idioma',
      spanish: 'Espanhol',
      english: 'Inglês',
      portuguese: 'Português'
    }
  } as const;

  constructor(
    private authService: AuthService,
    private appointmentsService: AppointmentsService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.authService.getUser();
    this.userData = this.authService.getUserData();
    this.language = this.authService.getLanguage();
  }

  get t() {
    return this.translations[this.language];
  }

  get displayName(): string {
    return this.userData?.firstName || 'Usuário';
  }

  setLanguage(language: 'es' | 'en' | 'pt') {
    this.authService.setLanguage(language);
    this.language = language;
  }

  async downloadMedicalHistoryPdf(): Promise<void> {
    if (!this.userData?.uid) {
      await Swal.fire('No disponible', 'No se pudo obtener el usuario actual.', 'info');
      return;
    }

    let generated = false;
    let errorMessage = 'No se pudo generar la historia clínica.';
    try {
      this.isLoading = true;
      await this.appointmentsService.generateMedicalHistoryPdfByUserId(this.userData.uid);
      generated = true;
    } catch (error) {
      console.error('Error al generar la historia clínica:', error);
      errorMessage = error instanceof Error && error.message === 'No medical history found for this user'
        ? 'Todavía no tenés historia clínica registrada.'
        : 'No se pudo generar la historia clínica.';
    } finally {
      this.isLoading = false;
    }

    if (generated) {
      await Swal.fire('PDF generado', 'La historia clínica se descargó correctamente.', 'success');
      return;
    }

    await Swal.fire('Error', errorMessage, 'error');
  }
}
