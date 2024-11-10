import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterPageEspecialistaComponent } from './register-page-especialista.component';

describe('RegisterPageEspecialistaComponent', () => {
  let component: RegisterPageEspecialistaComponent;
  let fixture: ComponentFixture<RegisterPageEspecialistaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPageEspecialistaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterPageEspecialistaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
