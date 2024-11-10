import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-captcha',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './captcha.component.html',
  styleUrls: ['./captcha.component.css'] 
})
export class CaptchaComponent {
  captchaString: string = '';
  public userInput: string = '';
  public honeypot: string = '';
  public isCaptchaVisible: boolean = true;
  @Output() captchaValidated = new EventEmitter<boolean>();

  constructor() {
    this.generateCaptcha();
  }

  generateCaptcha() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    this.captchaString = Array.from({ length: 6 }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
  }

  validateCaptcha() {
    if (this.honeypot) {
      this.captchaValidated.emit(false); 
      return;
    }

    const isValid = this.userInput === this.captchaString;
    console.log(isValid);
    this.captchaValidated.emit(isValid);
  }

  refreshCaptcha() {
    this.userInput = '';
    this.honeypot = ''; 
    this.generateCaptcha();
  }
}