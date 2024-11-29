import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'specialtyName',
  standalone: true
})
export class SpecialtyNamePipe implements PipeTransform {

  transform(specialty: any): unknown {
    return specialty['especialidad']
  }

}
