import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { AuthService } from '../../../services/auth/auth.service';
import { addDoc, collection, Firestore, query } from '@angular/fire/firestore';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { SpecialtyNamePipe } from '../../../pipes/specialty-name-pipe/specialty-name.pipe';
import { AppointmentsService } from '../../../services/appointments/appointments.service';
@Component({
  selector: 'app-register-especialista',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,SpecialtyNamePipe],
  templateUrl: './register-especialista.component.html',
  styleUrl: './register-especialista.component.css'
})
export class RegisterEspecialistaComponent implements OnInit {
  @Input() isCaptchaValidated: boolean = false;
  @Input() isCaptchaEnabled: boolean = true;
  registerForm: FormGroup;
  specialties: { especialidad: string; image: string }[] = [];
  newSpecialtyImage: File | null = null;
  newSpecialtyImageName = 'Sin imagen seleccionada';
  showNewSpecialtyForm = false;

  constructor(private router: Router, private firestore: Firestore, private authService: AuthService, private appointmentsService:AppointmentsService, private supabaseService: SupabaseService) {
    this.registerForm = new FormGroup({
      firstName: new FormControl('', [Validators.required, Validators.minLength(3)]),
      lastName: new FormControl('', [Validators.required, Validators.minLength(3)]),
      age: new FormControl('', [Validators.required, Validators.min(18), Validators.max(100)]),
      dni: new FormControl('', [Validators.required, Validators.pattern(/^\d{8}$/)]),
      specialties: new FormControl([], Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      profileImage: new FormControl(null, [
        Validators.required,
        this.fileTypeValidator(['image/jpeg', 'image/png']),
        this.fileSizeValidator(2)
      ])
    });
  }


  get firstName() { return this.registerForm.get('firstName'); }
  get lastName() { return this.registerForm.get('lastName'); }
  get age() { return this.registerForm.get('age'); }
  get dni() { return this.registerForm.get('dni'); }
  get specialty() { return this.registerForm.get('specialty'); }
  get otherSpecialty() { return this.registerForm.get('otherSpecialty'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get profileImage() { return this.registerForm.get('profileImage'); }

  ngOnInit() {
    this.loadSpecialties();
  }

  async loadSpecialties() {
    try {
      this.specialties = await this.appointmentsService.getSpecialties();
    } catch (error) {
      console.error('Error loading specialties:', error);
    }
  }

  addSpecialty(specialty: string, event: any) {
    const currentSpecialties = this.registerForm.get('specialties')?.value || [];
    if (event.target.checked) {
      currentSpecialties.push(specialty);
    } else {
      const index = currentSpecialties.indexOf(specialty);
      if (index >= 0) {
        currentSpecialties.splice(index, 1);
      }
    }
    this.registerForm.get('specialties')?.setValue(currentSpecialties);
    console.log(this.registerForm.get('specialties')?.value)
  }



  onNewSpecialtyImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newSpecialtyImage = input.files?.[0] || null;
    this.newSpecialtyImageName = this.newSpecialtyImage?.name || 'Sin imagen seleccionada';
  }

  async createSpecialty(newSpecialty: string) {
    try {
      if (newSpecialty) {
        const specialtiesRef = collection(this.firestore, 'especialidades');
        let imageUrl = '';

        if (this.newSpecialtyImage) {
          const safeName = newSpecialty
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9\-]/g, '');
          const path = `especialidades/${safeName}-${Date.now()}.${this.getFileExtension(this.newSpecialtyImage.name)}`;
          await this.supabaseService.uploadFile('other', path, this.newSpecialtyImage);
          const { data: imageData } = this.supabaseService.getPublicUrl('other', path);
          imageUrl = imageData.publicUrl;
        }

        await addDoc(specialtiesRef, {
          especialidad: newSpecialty,
          image: imageUrl
        });

        this.newSpecialtyImage = null;
        this.newSpecialtyImageName = 'Sin imagen seleccionada';
        this.showNewSpecialtyForm = false;
        await this.loadSpecialties();
      }
    } catch (error) {
      console.error('Error creating new specialty:', error);
    }
  }

  toggleNewSpecialtyForm(): void {
    this.showNewSpecialtyForm = !this.showNewSpecialtyForm;
  }

  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop() || 'png' : 'png';
  }

  onSpecialtyToggle(event: Event, specialty: string) {
    const checkbox = event.target as HTMLInputElement;
    const currentSpecialties = this.registerForm.get('specialties')?.value || [];
    console.log(currentSpecialties);

    if (checkbox.checked) {
      if (!currentSpecialties.includes(specialty)) {
        currentSpecialties.push(specialty);
      }
    } else {
      const index = currentSpecialties.indexOf(specialty);
      if (index > -1) {
        currentSpecialties.splice(index, 1);
      }
    }
    this.registerForm.get('specialties')?.setValue(currentSpecialties);
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
  

  async onSubmit() {
    if (!this.isCaptchaValidated) {
      if (!this.isCaptchaEnabled) {
        this.isCaptchaValidated = true;
      } else {
        Swal.fire({
          title: 'Error',
          text: 'Por favor, valida el captcha antes de continuar.',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
        return;
      }
    }

    const auth = getAuth();
    const email = this.registerForm.get('email')?.value;
    const password = this.registerForm.get('password')?.value;

    if (this.registerForm.valid) {
      createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
          const user = userCredential.user;

          const file = this.registerForm.get('profileImage')?.value;
          const path = `especialistas/${user.uid}/profileImage.jpg`;
          await this.supabaseService.uploadFile('profiles', path, file);
          const { data: imageData } = this.supabaseService.getPublicUrl('profiles', path);
          const profileImageUrl = imageData.publicUrl;
          await sendEmailVerification(user);

          const especialistaData = {
            uid: user.uid,
            firstName: this.registerForm.get('firstName')?.value,
            lastName: this.registerForm.get('lastName')?.value,
            age: this.registerForm.get('age')?.value,
            dni: this.registerForm.get('dni')?.value,
            specialties: this.registerForm.get('specialties')?.value || [],
            email: this.registerForm.get('email')?.value,
            approved: false, 
            role: 'especialista',
            profileImage: profileImageUrl 
          };

          const especialistasRef = collection(this.firestore, 'especialistas');
          await addDoc(especialistasRef, especialistaData);

          Swal.fire({
            title: 'Registro exitoso',
            text: 'Por favor, verifica tu correo electrónico y espera la aprobación del administrador',
            icon: 'success',
            confirmButtonText: 'Ok'
          });

          this.router.navigate(['/home']);
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
