import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import Swal from 'sweetalert2';
import { SpinnerComponent } from '../spinner/spinner.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, SpinnerComponent, SidebarComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css' 
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  loadingMessage = 'Iniciando sesión...';

  constructor(
    private router: Router,
    private firestore: Firestore
  ) {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required])
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  async onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.loadingMessage = 'Verificando credenciales';
  
      const auth = getAuth();
  
      try {
        const userCredential = await this.signIn(auth);
        const user = userCredential.user;
        const userDoc = await this.findUserInCollections(user.uid);
        console.log(userDoc)
        await this.checkEmailVerification(user, userDoc!.role);
        await this.handleUserRole(userDoc);
        
        this.redirectUser(userDoc!.role);
  
      } catch (error: any) {
        this.handleError(error);
      } finally {
        this.isLoading = false;
      }
    }
  }
  
  private async signIn(auth: any) {
    return await signInWithEmailAndPassword(
      auth,
      this.email?.value,
      this.password?.value
    );
  }
  
  private async checkEmailVerification(user: any, role: string) {
    console.log(user)
    if (role !== 'admin' && !user.emailVerified) {
      console.log('Por favor, verifica tu email antes de iniciar sesión');
      console.log(user);
      throw new Error('Email no verificado');
    }
  }
  
  private async handleUserRole(userDoc: any) {
    if (!userDoc) {
      throw new Error('Usuario no encontrado');
    }
  
    if (userDoc.role === 'especialista' && !(userDoc as any).approved) {
      Swal.fire({
        icon: 'question',
        title: 'Hubo un error',
        text: 'Tu aprobación está siendo revisada por uno de nuestros administradores',
      });
      throw new Error('Aprobación pendiente');
    }
  
    Swal.fire({
      icon: 'success',
      title: '¡Bienvenido!',
      text: `Has iniciado sesión como ${userDoc.role}`,
    });
  
    localStorage.setItem('userRole', userDoc.role);
    localStorage.setItem('userData', JSON.stringify(userDoc));
  }
  
  private redirectUser (role: string) {
    switch (role) {
      case 'admin':
        this.router.navigate(['/admin']);
        break;
      case 'especialista':
        this.router.navigate(['/especialista']);
        break;
      case 'paciente':
        this.router.navigate(['/paciente']);
        break;
      default:
        this.router.navigate(['/home']);
    }
  }
  
  private handleError(error: any) {
    let errorMessage = '';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'Usuario no encontrado';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Contraseña incorrecta';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Email inválido';
        break;
      case 'auth/user-disabled':
        errorMessage = 'Usuario deshabilitado';
        break;
      case 'auth/invalid-credential':
        errorMessage = 'Credenciales incorrectas';
        break;
      default:
        errorMessage = error.message || 'Ocurrió un error desconocido';
    }
  
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: errorMessage
    });
  }

  private async findUserInCollections(uid: string) {
    const collections = ['administradores', 'especialistas', 'pacientes'];
    
    for (const collectionName of collections) {
      const q = query(
        collection(this.firestore, collectionName),
        where('uid', '==', uid)
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        return {
          ...userData,
          role: collectionName === 'administradores' ? 'admin' : 
                collectionName === 'especialistas' ? 'especialista' : 'paciente'
        };
      }
    }

    return null;
  }

  quickLogin(email: string, password: string) {
    this.loginForm.patchValue({
      email: email,
      password: password
    });
  }
}