import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { addDoc, collection, Firestore, query } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register-especialista',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-especialista.component.html',
  styleUrl: './register-especialista.component.css'
})
export class RegisterEspecialistaComponent {
  registerForm: FormGroup;

  constructor(private router: Router, private firestore: Firestore) {
    this.registerForm = new FormGroup({
      firstName: new FormControl('', [Validators.required, Validators.minLength(3)]),
      lastName: new FormControl('', [Validators.required, Validators.minLength(3)]),
      age: new FormControl('', [Validators.required, Validators.min(18), Validators.max(100)]),
      dni: new FormControl('', [Validators.required, Validators.pattern(/^\d{8}$/)]),
      specialty: new FormControl('', [Validators.required]),
      otherSpecialty: new FormControl(''),
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
  get specialty() { return this.registerForm.get('specialty'); }
  get otherSpecialty() { return this.registerForm.get('otherSpecialty'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get profileImage() { return this.registerForm.get('profileImage'); }

  onSpecialtyChange() {
    const specialtyControl = this.registerForm.get('specialty');
    const otherSpecialtyControl = this.registerForm.get('otherSpecialty');
  
    if (specialtyControl?.value === 'other') {
      otherSpecialtyControl?.setValidators([Validators.required, Validators.minLength(2)]);
    } else {
      otherSpecialtyControl?.clearValidators();
    }
    otherSpecialtyControl?.updateValueAndValidity();
  }

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
        const fileSize = file.size / 1024 / 1024; // convertir a MB
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
    const auth = getAuth();
    const email = this.email?.value;
    const password = this.password?.value;

    if (this.registerForm.valid) {
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;

          // Enviar correo de verificación
          sendEmailVerification(user)
            .then(() => {
              // Guardar datos adicionales en Firestore
              const especialistaData = {
                uid: user.uid,
                firstName: this.firstName?.value,
                lastName: this.lastName?.value,
                age: this.age?.value,
                dni: this.dni?.value,
                specialty: this.specialty?.value === 'other' ? this.otherSpecialty?.value : this.specialty?.value,
                email: this.email?.value,
                approved: false, 
                role: 'especialista'
              };

              // Agregar documento a Firestore
              const especialistasRef = collection(this.firestore, 'especialistas');
              addDoc(especialistasRef, especialistaData)
                .then(() => {
                  Swal.fire({
                    title: 'Registro exitoso',
                    text: 'Por favor, verifica tu correo electrónico y espera la aprobación del administrador',
                    icon: 'success',
                    confirmButtonText: 'Ok'
                  });
                  this.router.navigate(['/home']);
                })
                .catch((error) => {
                  console.error("Error adding document: ", error);
                });
            });
        })
        .catch((error) => {
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
    }
  }
}