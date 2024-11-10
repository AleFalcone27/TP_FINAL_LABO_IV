import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { addDoc, collection, Firestore, query } from '@angular/fire/firestore'
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'

@Component({
  selector: 'app-register-paciente',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register-paciente.component.html',
  styleUrl: './register-paciente.component.css'
})
export class RegisterPacienteComponent {

  registerForm: FormGroup;

  constructor(private router: Router, private firestore: Firestore) {
    this.registerForm = new FormGroup({
      firstName: new FormControl('', [Validators.required, Validators.minLength(4)]),
      lastName: new FormControl('', [Validators.required, Validators.minLength(4)]),
      age: new FormControl('', [Validators.required, Validators.min(18)]),
      dni: new FormControl('', [Validators.required, Validators.pattern(/^\d{8}$/)]),
      socialInsurance: new FormControl('', [Validators.required, Validators.minLength(2)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      profileImages: new FormControl([], [
        Validators.required,
        this.exactlyTwoFilesValidator(),
        this.multipleFilesTypeValidator(['image/jpeg', 'image/png']),
        this.multipleFilesSizeValidator(2)
      ]),
      acceptTerms: new FormControl(false, Validators.requiredTrue)
    });
  }

  get firstName() {return this.registerForm.get('firstName')}

  get lastName() {return this.registerForm.get('lastName')}

  get age() {return this.registerForm.get('age')}

  get dni() {return this.registerForm.get('dni')}

  get socialInsurance() {return this.registerForm.get('socialInsurance')}

  get email() {return this.registerForm.get('email')}

  get password() {return this.registerForm.get('password')}

  get profileImage1() {return this.registerForm.get('profileImage1')}

  get profileImage() {return this.registerForm.get('profileImage2')}

  get acceptTerms() {return this.registerForm.get('acceptTerms')}


  getInvalidFields(): string[] {
    const invalidFields: string[] = [];

    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      if (control?.invalid) {
        console.log(control)
      }
    });

    return invalidFields;
  }

  onSubmit() {
    const auth = getAuth();
    const email = this.email?.value;
    const password = this.password?.value;

    console.log(this.registerForm.valid)
    console.log(this.registerForm)
    this.getInvalidFields()
  
    if (this.registerForm.valid) {
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
  
          // Crear objeto con los datos del paciente
          const pacienteData = {
            uid: user.uid,
            firstName: this.firstName?.value,
            lastName: this.lastName?.value,
            age: this.age?.value,
            dni: this.dni?.value,
            socialInsurance: this.socialInsurance?.value,
            email: this.email?.value,
            role: 'paciente'
          };
  
          // Agregar el paciente a la colección 'pacientes' en Firestore
          const pacientesRef = collection(this.firestore, 'pacientes');
          addDoc(pacientesRef, pacienteData)
            .then(() => {
              // Enviar correo de verificación
              sendEmailVerification(user).then(() => {
                Swal.fire({
                  title: 'Bienvenido/a',
                  text: 'Revisa tu casilla para confirmar tu correo. Tus datos han sido registrados correctamente.',
                  icon: 'success',
                  confirmButtonText: 'Ok'
                });
                this.router.navigate(['/home']);
              });
            })
            .catch((error) => {
              console.error("Error al agregar el paciente a Firestore: ", error);
              Swal.fire({
                title: 'Error',
                text: 'Hubo un problema al registrar tus datos. Por favor, intenta nuevamente.',
                icon: 'error',
                confirmButtonText: 'Ok'
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
              console.log(error.code)
              errorMessage = 'Error desconocido';
          }
          Swal.fire({
            title: 'Algo salió mal...',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'Ok'
          });
        });
    }
  }

  onMultipleFilesSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.registerForm.patchValue({
      profileImages: files
    });
    this.registerForm.get('profileImages')?.updateValueAndValidity();
    this.registerForm.get('profileImages')?.markAsTouched();
  }

  exactlyTwoFilesValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const files = control.value as File[];
      return (!files || files.length !== 2) ? { exactlyTwoFiles: true } : null;
    };
  }
  
  multipleFilesTypeValidator(allowedTypes: string[]) {
    return (control: AbstractControl): ValidationErrors | null => {
      const files = control.value as File[];
      if (files && files.length > 0) {
        const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
        return invalidFiles.length > 0 ? { fileTypes: true } : null;
      }
      return null;
    };
  }
  
  multipleFilesSizeValidator(maxSize: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      const files = control.value as File[];
      if (files && files.length > 0) {
        const oversizedFiles = files.filter(file => (file.size / 1024 / 1024) > maxSize);
        return oversizedFiles.length > 0 ? { fileSizes: true } : null;
      }
      return null;
    };
  }
}





