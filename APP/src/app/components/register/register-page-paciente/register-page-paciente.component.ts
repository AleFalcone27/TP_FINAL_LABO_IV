import { Component, OnInit } from '@angular/core';
import { RegisterPacienteComponent } from '../register-paciente/register-paciente.component';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { fade } from '../../../animations/animations';
import { CaptchaService } from '../../../services/captcha/captcha.service';
import { OwnCaptchaDirective } from '../../../directives/captcha/captcha.directive';

@Component({
  selector: 'app-register-page-paciente',
  standalone: true,
  imports: [RegisterPacienteComponent, CommonModule, SidebarComponent, OwnCaptchaDirective],
  templateUrl: './register-page-paciente.component.html',
  styleUrls: ['./register-page-paciente.component.css'], 
  animations: [fade]
})
export class RegisterPagePacienteComponent implements OnInit {
  captchaValidated = false;
  captchaEnabled = true;

  constructor(private configService: CaptchaService) {}

  ngOnInit(): void {
    this.configService.captchaEnabled$.subscribe(enabled => {
      this.captchaEnabled = enabled;
      // Si el captcha está desactivado, marcar como validado automáticamente
      if (!enabled) {
        this.captchaValidated = true;
      }
    });
  }

  onCaptchaValidated(isValid: boolean) {
    this.captchaValidated = isValid; 
  }
}
