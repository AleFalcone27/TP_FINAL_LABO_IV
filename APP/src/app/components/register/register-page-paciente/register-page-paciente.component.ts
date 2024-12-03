import { Component } from '@angular/core';
import { RegisterPacienteComponent } from '../register-paciente/register-paciente.component';
import { CaptchaComponent } from '../../others/captcha/captcha/captcha.component';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { fade } from '../../../animations/animations';

@Component({
  selector: 'app-register-page-paciente',
  standalone: true,
  imports: [RegisterPacienteComponent, CaptchaComponent, CommonModule, SidebarComponent],
  templateUrl: './register-page-paciente.component.html',
  styleUrls: ['./register-page-paciente.component.css'], 
  animations: [fade]
})
export class RegisterPagePacienteComponent {
  captchaValidated = false;

  onCaptchaValidated(isValid: boolean) {
    this.captchaValidated = isValid; 
  }
}