import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../../services/supabase/supabase.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-captcha',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './captcha.component.html',
  styleUrls: ['./captcha.component.css']
})
export class CaptchaComponent implements OnInit {
  public userInput: string = '';
  public isCaptchaVisible: boolean = true;
  public captchaImageUrl: string = '';
  public validString: string = '';
  @Output() captchaValidated = new EventEmitter<boolean>();

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    this.getCaptchaImage();
  }

  refreshCaptcha() {
    this.userInput = '';
    this.validString = '';
    this.getCaptchaImage();
  }

  async getCaptchaImage(): Promise<void> {
    try {
      const randomIndex = Math.floor(Math.random() * 3) + 1;
      const path = `captcha${randomIndex}.jpeg`;
      const { data } = this.supabaseService.getPublicUrl('other', path);
      this.captchaImageUrl = data.publicUrl;
      console.log('Captcha URL:', this.captchaImageUrl);
      
      switch (randomIndex) {
        case 1:
          this.validString = '61760';
          break;
        case 2:
          this.validString = 'sciarna';
          break;
        case 3:
          this.validString = 'YKQET';
          break;
      }
    } catch (error) {
      console.error('Error al cargar captcha:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo cargar el captcha. Por favor, refresca la página.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    }
  }

  validateCaptcha() {
    if (this.normalizeCaptchaValue(this.userInput) === this.normalizeCaptchaValue(this.validString)) {
      this.captchaValidated.emit(true); 
      this.showSuccessPopup(); 
      this.isCaptchaVisible = false; 
    } else {
      this.showErrorPopup();
      this.captchaValidated.emit(false); 
    }
  }

  private normalizeCaptchaValue(value: string): string {
    return value.trim().toLowerCase();
  }

  private showSuccessPopup() {
    Swal.fire({
      title: '¡Éxito!',
      text: 'El captcha ha sido validado correctamente.',
      icon: 'success',
      confirmButtonText: 'Aceptar'
    });
  }

  private showErrorPopup() {
    Swal.fire({
      title: '¡Error!',
      text: '¿Eres un humano?',
      icon: 'error',
      confirmButtonText: 'Volver a intentar'
    });
  }

}
