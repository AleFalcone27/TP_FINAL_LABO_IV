import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PacienteHistoriaMedicaComponent } from './paciente-historia-medica.component';

describe('PacienteHistoriaMedicaComponent', () => {
  let component: PacienteHistoriaMedicaComponent;
  let fixture: ComponentFixture<PacienteHistoriaMedicaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PacienteHistoriaMedicaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PacienteHistoriaMedicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
