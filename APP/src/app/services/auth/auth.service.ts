import { Auth } from '@angular/fire/auth';
import { getAuth, signOut } from "firebase/auth";
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Firestore, collection, addDoc, Timestamp, query, where, getDocs, orderBy } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  

  user!: object | null;
  auth!: Auth;

  constructor(private firestore: Firestore) {
    this.auth = getAuth();
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

  // public async isAdmin(): Promise<boolean> {
  //   try {
  //     if (!this.auth.currentUser) {

  //       return false;
  //     }

  //     const adminsRef = collection(this.firestore, 'admins');
  //     const q = query(adminsRef, where('user', '==', this.auth.currentUser.uid));
  //     const querySnapshot = await getDocs(q);
      
  //     const isAdmin = !querySnapshot.empty;
    
  //     return isAdmin;
  //   } catch (error) {
  //     console.error('Error checking admin status:', error);
      
  //     return false;
  //   }
  // }



  // getAdminStatus(): boolean {
  //   return JSON.parse(localStorage.getItem('isAdmin') || 'false');
  // }

  // LogOut() {
  //   signOut(this.auth);
  // }
}