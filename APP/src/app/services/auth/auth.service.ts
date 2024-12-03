import { Auth, User } from '@angular/fire/auth';
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Firestore, collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private user: User | null = null;
  private userData: any;
  private auth;

  private authStateSubject = new BehaviorSubject<boolean>(false);
  public authState$ = this.authStateSubject.asObservable();

  constructor(private firestore: Firestore) {
    this.auth = getAuth();
    this.updateAuthState();
    this.getUser();
  }

  get currentUser(): User | null {
    return this.user;
  }

  private updateAuthState() {
    this.authStateSubject.next(this.isLoggedIn());
  }

  public async logIn(email: string, password: string) {
    this.updateAuthState();
  }

  public getCurrentUserFirstName() {
    return this.auth.currentUser?.email?.split('@')[0];
  }

  public getUserData(): any {
    return JSON.parse(localStorage.getItem('userData') || '{}');
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
          const userData = doc.data();
          localStorage.setItem('userDocument', JSON.stringify(userData));
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

  public isLoggedIn(): boolean {
    return !!this.auth.currentUser;
  }

  async updateAppointmentDuration(appointmentDuration: string, schedule: any): Promise<void> {

    const user = this.getUserData();
    const collectionRef = collection(this.firestore, 'especialistas');
    const q = query(collectionRef, where('uid', '==', user['uid']));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('No document to update.');
    }
    const docRef = querySnapshot.docs[0].ref;

    await updateDoc(docRef, {
      AppointmentDuration: appointmentDuration,
      Schedule: schedule
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

}