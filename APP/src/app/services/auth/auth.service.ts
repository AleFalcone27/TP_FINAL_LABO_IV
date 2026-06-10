import { Auth, User } from '@angular/fire/auth';
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Firestore, collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc } from '@angular/fire/firestore';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly languageStorageKey = 'appLanguage';

  private user: User | null = null;
  private userData: any;
  private auth;

  private authStateSubject = new BehaviorSubject<boolean>(false);
  public authState$ = this.authStateSubject.asObservable();

  constructor(
    private firestore: Firestore,
    private supabaseService: SupabaseService
  ) {
    this.auth = getAuth();
    
    // Escuchar cambios en el estado de autenticación
    onAuthStateChanged(this.auth, async (user) => {
      this.user = user;
      console.log('🔐 Estado de autenticación cambió:', user ? 'Autenticado' : 'No autenticado');
      this.updateAuthState();
      if (user) {
        await this.getUser();
      }
    });
  }

  get currentUser(): User | null {
    return this.user;
  }

  private updateAuthState() {
    const isAuthenticated = this.isLoggedIn();
    console.log('📢 Actualizando authState:', isAuthenticated);
    this.authStateSubject.next(isAuthenticated);
  }

  public async logIn(email: string, password: string) {
    this.updateAuthState();
  }

  public getCurrentUserFirstName() {
    return this.auth.currentUser?.email?.split('@')[0];
  }

  public getUserData(): any {
    return JSON.parse(localStorage.getItem('userData') || localStorage.getItem('userDocument') || '{}');
  }

  public getCurrentUserEmail() {
    return this.auth.currentUser?.email;
  }

  public async getUser(): Promise<void> {
    try {
      if (!this.auth.currentUser) {
        return;
      }

      const uid = this.auth.currentUser.uid;
      const collections = ['admins', 'especialistas', 'pacientes'];

      for (const collectionName of collections) {
        const collectionRef = collection(this.firestore, collectionName);
        const q = query(collectionRef, where('uid', '==', uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const userData = this.normalizeUserData(doc.data());
          localStorage.setItem('userDocument', JSON.stringify(userData));
          localStorage.setItem('userData', JSON.stringify(userData));
          this.userData = userData;
          return;
        }
      }
    } catch (error) {
      console.error('Error retrieving user role:', error);
    }
  }

  public getRole(): string | null {
    return localStorage.getItem('userRole');
  }

  public getLanguage(): 'es' | 'en' | 'pt' {
    const storedLanguage = localStorage.getItem(this.languageStorageKey);
    return storedLanguage === 'en' || storedLanguage === 'pt' ? storedLanguage : 'es';
  }

  public setLanguage(language: 'es' | 'en' | 'pt'): void {
    localStorage.setItem(this.languageStorageKey, language);
  }

  public isLoggedIn(): boolean {
    return this.user !== null;
  }

  async updateAppointmentDurations(schedulesToUpdate: { specialty: string; appointmentDuration: string; schedule: any }[]): Promise<void> {


    console.log(schedulesToUpdate)

    const user = this.getUserData();
    const collectionRef = collection(this.firestore, 'especialistas');
    const q = query(collectionRef, where('uid', '==', user['uid']));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('No document to update.');
    }

    const docRef = querySnapshot.docs[0].ref;

    // Prepare the data to update
    const updatedSchedules: UpdatedSchedules = {}; // Specify the type here

    schedulesToUpdate.forEach(({ specialty, appointmentDuration, schedule }) => {
      updatedSchedules[specialty] = {
        AppointmentDuration: appointmentDuration,
        Schedule: schedule
      };
    });

    // Update the document with the new schedules
    await updateDoc(docRef, {
      Specialties: updatedSchedules
    });
  }



  async getDoctorSchedule(): Promise<any> {
    const user = await this.getUserData();
    const collectionRef = collection(this.firestore, 'especialistas');
    const q = query(collectionRef, where('uid', '==', user['uid']));
    const querySnapshot = await getDocs(q);

    const docRef = querySnapshot.docs[0];
    const docSnapshot = docRef.data();
    return docSnapshot
  }

  public logOut() {
    localStorage.removeItem('userDocument');
    localStorage.removeItem('current-user');
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem(this.languageStorageKey);

    signOut(this.auth).then(() => {
      this.updateAuthState();
      console.log('User  signed out');
    }).catch((error) => {
      console.error('Sign out error:', error);
    });
  }

  getUserId(): string | undefined {
    return this.userData ? this.userData.id : undefined;
  }

  private normalizeUserData(userData: any): any {
    if (!userData) {
      return userData;
    }

    const normalized = { ...userData };
    const bucket = 'profiles';

    if (Array.isArray(normalized.profileImages)) {
      normalized.profileImages = normalized.profileImages.map((imageUrl: string) =>
        this.supabaseService.resolveStorageUrl(bucket, imageUrl)
      );
    }

    if (normalized.profileImage) {
      normalized.profileImage = this.supabaseService.resolveStorageUrl(bucket, normalized.profileImage);
    }

    if (normalized.profileImage1) {
      normalized.profileImage1 = this.supabaseService.resolveStorageUrl(bucket, normalized.profileImage1);
    }

    if (normalized.profileImage2) {
      normalized.profileImage2 = this.supabaseService.resolveStorageUrl(bucket, normalized.profileImage2);
    }

    return normalized;
  }

}


interface ScheduleUpdate {
  AppointmentDuration: string;
  Schedule: any;
}

interface UpdatedSchedules {
  [specialty: string]: ScheduleUpdate; // Allows dynamic keys of type string
}
