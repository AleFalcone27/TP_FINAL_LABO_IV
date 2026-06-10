import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { addDoc, collection, Firestore } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { SupabaseService } from '../../../services/supabase/supabase.service';

@Component({
  selector: 'app-register-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-admin.component.html',
  styleUrl: './register-admin.component.css'
})
export class RegisterAdminComponent {
  registerForm: FormGroup;
  isLoading = false;
  loadingMessage = '';

  constructor(
    private router: Router,
    private firestore: Firestore,
    private supabaseService: SupabaseService
  ) {
    this.registerForm = new FormGroup({
      firstName: new FormControl('', [Validators.required, Validators.minLength(3)]),
      lastName: new FormControl('', [Validators.required, Validators.minLength(3)]),
      age: new FormControl('', [Validators.required, Validators.min(18), Validators.max(100)]),
      dni: new FormControl('', [Validators.required, Validators.pattern(/^\d{8}$/)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      profileImage: new FormControl(null, [
        Validators.required,
        this.fileTypeValidator(['image/jpeg', 'image/png']),
        this.fileSizeValidator(2)
      ])
    });
  }

  // Getters para acceder fácilmente a los controles del formulario
  get firstName() { return this.registerForm.get('firstName'); }
  get lastName() { return this.registerForm.get('lastName'); }
  get age() { return this.registerForm.get('age'); }
  get dni() { return this.registerForm.get('dni'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get profileImage() { return this.registerForm.get('profileImage'); }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.registerForm.patchValue({
      profileImage: file
    });
    this.registerForm.get('profileImage')?.updateValueAndValidity();
  }

  fileTypeValidator(allowedTypes: string[]) {
    return (control: AbstractControl): ValidationErrors | null => {
      const file = control.value as File;
      if (file) {
        if (!allowedTypes.includes(file.type)) {
          return {
            fileType: {
              allowed: allowedTypes,
              actual: file.type
            }
          };
        }
      }
      return null;
    };
  }

  fileSizeValidator(maxSize: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      const file = control.value as File;
      if (file) {
        const fileSize = file.size / 1024 / 1024;
        if (fileSize > maxSize) {
          return {
            fileSize: {
              allowed: maxSize,
              actual: fileSize
            }
          };
        }
      }
      return null;
    };
  }

  onSubmit() {
    this.isLoading = true;
    this.loadingMessage = 'Registrando administrador';

    const auth = getAuth();
    const email = this.email?.value;
    const password = this.password?.value;

    if (this.registerForm.valid) {
      createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
          const user = userCredential.user;
          const file = this.registerForm.get('profileImage')?.value;
          let profileImageUrl = '';

          if (file) {
            const extension = this.getFileExtension(file.name);
            const path = `admins/${user.uid}/profileImage.${extension}`;
            await this.supabaseService.uploadFile('profiles', path, file);
            const { data } = this.supabaseService.getPublicUrl('profiles', path);
            profileImageUrl = data.publicUrl;
          }

          const adminData = {
            uid: user.uid,
            firstName: this.firstName?.value,
            lastName: this.lastName?.value,
            age: this.age?.value,
            dni: this.dni?.value,
            email: this.email?.value,
            role: 'admin',
            profileImage: profileImageUrl
          };


          const adminsRef = collection(this.firestore, 'administradores');
          addDoc(adminsRef, adminData)
            .then(() => {
              this.isLoading = false;
              Swal.fire({
                title: 'Registro exitoso',
                text: 'El administrador ha sido registrado correctamente',
                icon: 'success',
                confirmButtonText: 'Ok'
              });
              this.router.navigate(['/home']);
            })
            .catch((error) => {
              this.isLoading = false;
              console.error("Error adding document: ", error);
              Swal.fire({
                title: 'Error',
                text: 'Error al guardar los datos del administrador',
                icon: 'error',
                confirmButtonText: 'Ok'
              });
            });
        })
        .catch((error) => {
          this.isLoading = false;
          let errorMessage = '';
          switch (error.code) {
            case 'auth/invalid-email':
              errorMessage = 'El formato de correo electrónico es inválido';
              break;
            case 'auth/email-already-in-use':
              errorMessage = 'El correo electrónico ya está en uso';
              break;
            case 'auth/operation-not-allowed':
              errorMessage = 'La operación no está permitida';
              break;
            case 'auth/weak-password':
              errorMessage = 'La contraseña es demasiado débil';
              break;
            default:
              errorMessage = 'Error desconocido';
          }
          Swal.fire({
            title: 'Error',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'Ok'
          });
      });
    } else {
      this.isLoading = false;
      this.registerForm.markAllAsTouched();
    }
  }

  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop() || 'jpg' : 'jpg';
  }
}
