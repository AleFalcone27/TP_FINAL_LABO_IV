import { Component } from '@angular/core';
import { RegisterPacienteComponent } from '../register-paciente/register-paciente.component';
import { CaptchaComponent } from '../../others/captcha/captcha/captcha.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register-page-paciente',
  standalone: true,
  imports: [RegisterPacienteComponent,CaptchaComponent, CommonModule],
  templateUrl: './register-page-paciente.component.html',
  styleUrl: './register-page-paciente.component.css'
  
})
export class RegisterPagePacienteComponent {

  captchaValidated = false;

  onCaptchaValidated(isValid: boolean) {
    this.captchaValidated = isValid; 
  }
}
