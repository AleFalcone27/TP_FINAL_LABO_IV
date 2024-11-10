import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterPagePacienteComponent } from './register-page-paciente.component';

describe('RegisterPagePacienteComponent', () => {
  let component: RegisterPagePacienteComponent;
  let fixture: ComponentFixture<RegisterPagePacienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPagePacienteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterPagePacienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
