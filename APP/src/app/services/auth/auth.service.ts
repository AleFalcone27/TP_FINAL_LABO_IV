import { Auth } from '@angular/fire/auth';
import { getAuth, signOut } from "firebase/auth";
import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Firestore, collection, addDoc, Timestamp, query, where, getDocs, orderBy } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnInit {

  user!: object | null;
  auth!: Auth;

  private authStateSubject = new BehaviorSubject<boolean>(false);
  public authState$ = this.authStateSubject.asObservable();

  constructor(private firestore: Firestore) {
    this.auth = getAuth();
    this.auth = getAuth();
    this.updateAuthState();
  }

  private updateAuthState() {
    this.authStateSubject.next(this.isLoggedIn());
  }

  ngOnInit(): void {
    this.getUser()
  }

  public async logIn(email: string, password: string) {
    this.updateAuthState();
  }


  public getCurrentUSerFirtsName() {
    return this.auth.currentUser?.email?.split('@')[0];
  }

  public getUserData(): any {
    return JSON.parse(localStorage.getItem('userDocument') || '{}');
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

  public async getSpecialties(): Promise<{ especialidad: string; image: string }[]> {
    try {
      const specialtiesRef = collection(this.firestore, 'especialidades');
      const querySnapshot = await getDocs(specialtiesRef);
      return querySnapshot.docs.map(doc => ({
        especialidad: doc.data()['especialidad'],
        image: doc.data()['image'],
      }));
    } catch (error) {
      console.error('Error fetching specialties:', error);
      return [];
    }
  }

  public isLoggedIn(): boolean {
    return !!this.auth.currentUser;
  }

  async getDoctorsBySpecialty(specialty: string): Promise<any[]> {
    try {
      const especialistasRef = collection(this.firestore, 'especialistas');
      const q = query(especialistasRef, where('specialties', 'array-contains', specialty));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching doctors:', error);
      return [];
    }
  }

  public logOut() {
    signOut(this.auth).then(() => {
      localStorage.removeItem('userDocument');
      localStorage.removeItem('userRole');
      this.updateAuthState();
    });
  }

}