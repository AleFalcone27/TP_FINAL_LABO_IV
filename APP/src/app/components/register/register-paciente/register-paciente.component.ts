import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { addDoc, collection, Firestore, query } from '@angular/fire/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL, Storage } from '@angular/fire/storage';
import { SpinnerComponent } from '../../spinner/spinner.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'

@Component({
  selector: 'app-register-paciente',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, SpinnerComponent],
  templateUrl: './register-paciente.component.html',
  styleUrl: './register-paciente.component.css'
})
export class RegisterPacienteComponent {

  isLoading = false;
  loadingMessage = '';
  registerForm: FormGroup;

  constructor(private router: Router, private firestore: Firestore, private storage: Storage) {
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

  get firstName() { return this.registerForm.get('firstName') }

  get lastName() { return this.registerForm.get('lastName') }

  get age() { return this.registerForm.get('age') }

  get dni() { return this.registerForm.get('dni') }

  get socialInsurance() { return this.registerForm.get('socialInsurance') }

  get email() { return this.registerForm.get('email') }

  get password() { return this.registerForm.get('password') }

  get profileImage1() { return this.registerForm.get('profileImage1') }

  get profileImage() { return this.registerForm.get('profileImage2') }

  get acceptTerms() { return this.registerForm.get('acceptTerms') }

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

  async onSubmit() {

    this.isLoading = true;
    this.loadingMessage = 'Registrando paciente';

    const auth = getAuth();
    const storage = getStorage(); 
    const email = this.registerForm.get('email')?.value;
    const password = this.registerForm.get('password')?.value;

    if (this.registerForm.valid) {
        createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                const user = userCredential.user;

                const files = this.registerForm.get('profileImages')?.value; 
                const profileImageUrls = [];

                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const storageRef = ref(storage, `users/${user.uid}/profile_image_${i + 1}.jpg`);
                    await uploadBytes(storageRef, file);
                    const profileImageUrl = await getDownloadURL(storageRef);
                    profileImageUrls.push(profileImageUrl);
                }

                await sendEmailVerification(user);

                const pacienteData = {
                    uid: user.uid,
                    firstName: this.registerForm.get('firstName')?.value,
                    lastName: this.registerForm.get('lastName')?.value,
                    age: this.registerForm.get('age')?.value,
                    dni: this.registerForm.get('dni')?.value,
                    socialInsurance: this.registerForm.get('socialInsurance')?.value,
                    email: this.registerForm.get('email')?.value,
                    approved: false,
                    role: 'paciente',
                    profileImage1: profileImageUrls[0], 
                    profileImage2: profileImageUrls[1]  
                };

                const pacientesRef = collection(this.firestore, 'pacientes');
                await addDoc(pacientesRef, pacienteData);

                this.isLoading = false;

                Swal.fire({
                    title: 'Registro exitoso',
                    text: 'Por favor, verifica tu correo electrónico y espera la aprobación del administrador',
                    icon: 'success',
                    confirmButtonText: 'Ok'
                });

                this.router.navigate(['/home']);
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
    }
}


  async uploadFiles(uid: string, files: File[]): Promise<string[]> {
    const uploadPromises = files.map((file, index) => {
      const filePath = `users/${uid}/profile_image_${index + 1}.${file.name.split('.').pop()}`;
      const fileRef = ref(this.storage, filePath);

      return uploadBytes(fileRef, file).then(() => filePath);
    });

    return Promise.all(uploadPromises);
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





