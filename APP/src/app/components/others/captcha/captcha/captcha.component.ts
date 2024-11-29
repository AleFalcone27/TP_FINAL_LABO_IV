import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { getStorage, ref, getDownloadURL } from '@angular/fire/storage';
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

  constructor() {}

  ngOnInit() {
    this.getCaptchaImage();
  }

  refreshCaptcha() {
    this.userInput = '';
    this.validString = '';
    this.getCaptchaImage();
  }

  async getCaptchaImage(): Promise<void> {
    const storage = getStorage();
    const randomIndex = Math.floor(Math.random() * 3) + 1;
    const imageRef = ref(storage, `captcha/captcha${randomIndex}.png`);
    this.captchaImageUrl = await getDownloadURL(imageRef);
    switch (randomIndex) {
      case 1:
        this.validString = '61760';
        break;
      case 2:
        this.validString = 'YKQET';
        break;
      case 3:
        this.validString = 'sciarna';
        break;
    }
  }

  validateCaptcha() {
    if (this.userInput === this.validString) {
      this.captchaValidated.emit(true); 
      this.showSuccessPopup(); 
      this.isCaptchaVisible = false; 
    } else {
      this.showErrorPopup();
      this.captchaValidated.emit(false); 
    }
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
      text: 'Eres un huumano?',
      icon: 'error',
      confirmButtonText: 'Volver a intentar'
    });
  }

}