import { Component, OnInit } from '@angular/core';
import { RegisterEspecialistaComponent } from '../register-especialista/register-especialista.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { fade } from '../../../animations/animations';
import { CommonModule } from '@angular/common';
import { CaptchaService } from '../../../services/captcha/captcha.service';
import { OwnCaptchaDirective } from '../../../directives/captcha/captcha.directive';

@Component({
  selector: 'app-register-page-especialista',
  standalone: true,
  imports: [RegisterEspecialistaComponent, SidebarComponent, CommonModule, OwnCaptchaDirective],
  templateUrl: './register-page-especialista.component.html',
  styleUrl: './register-page-especialista.component.css',
  animations: [fade]
})
export class RegisterPageEspecialistaComponent implements OnInit {
  captchaValidated = false;
  captchaEnabled = true;

  constructor(private configService: CaptchaService) {}

  ngOnInit(): void {
    this.configService.captchaEnabled$.subscribe(enabled => {
      this.captchaEnabled = enabled;
      if (!enabled) {
        this.captchaValidated = true;
      }
    });
  }

  onCaptchaValidated(isValid: boolean) {
    this.captchaValidated = isValid;
  }
}
