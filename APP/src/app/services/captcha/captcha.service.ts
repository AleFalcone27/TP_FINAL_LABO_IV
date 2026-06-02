import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CaptchaService {
  private captchaEnabledSubject = new BehaviorSubject<boolean>(true);
  public captchaEnabled$: Observable<boolean> = this.captchaEnabledSubject.asObservable();

  constructor(private firestore: Firestore) {
    this.loadCaptchaConfig();
  }

  async loadCaptchaConfig(): Promise<void> {
    try {
      const configDocRef = doc(this.firestore, 'configuracion', 'captcha');
      const configDoc = await getDoc(configDocRef);
      
      if (configDoc.exists()) {
        const enabled = configDoc.data()['enabled'] ?? true;
        this.captchaEnabledSubject.next(enabled);
      } else {
        await this.setCaptchaEnabled(true);
      }
    } catch (error) {
      this.captchaEnabledSubject.next(true); // Por defecto activado
    }
  }

  async setCaptchaEnabled(enabled: boolean): Promise<void> {
    try {
      const configDocRef = doc(this.firestore, 'configuracion', 'captcha');
      await setDoc(configDocRef, { enabled, updatedAt: new Date() }, { merge: true });
      this.captchaEnabledSubject.next(enabled);
    } catch (error) {
      throw error;
    }
  }

  getCaptchaEnabled(): boolean {
    return this.captchaEnabledSubject.value;
  }
}
