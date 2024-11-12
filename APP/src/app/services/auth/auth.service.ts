import { Auth } from '@angular/fire/auth';
import { getAuth, signOut } from "firebase/auth";
import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Firestore, collection, addDoc, Timestamp, query, where, getDocs, orderBy } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnInit{
  

  user!: object | null;
  auth!: Auth;

  constructor(private firestore: Firestore) {
    this.auth = getAuth();
  }


  ngOnInit(): void {
    this.getUser()
  }

  public isLoggedIn() {
    return this.auth.currentUser;
  }

  public getCurrentUSerFirtsName() {
    return this.auth.currentUser?.email?.split('@')[0];
  }

  public getCurrentUserEmail() {
    return this.auth.currentUser?.email;
  }

  public async getUser(): Promise<void> {
    try {
      if (!this.auth.currentUser ) {
        return;
      }

      const uid = this.auth.currentUser .uid;
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

  public logOut() {
    signOut(this.auth).then(() => {
      localStorage.removeItem('userDocument');
      localStorage.removeItem('userRole');
    });
  }
}