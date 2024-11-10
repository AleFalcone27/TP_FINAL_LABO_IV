import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterEspecialistaComponent } from './register-especialista.component';

describe('RegisterEspecialistaComponent', () => {
  let component: RegisterEspecialistaComponent;
  let fixture: ComponentFixture<RegisterEspecialistaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterEspecialistaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterEspecialistaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
