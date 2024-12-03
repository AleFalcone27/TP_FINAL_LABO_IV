import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatHour',
  standalone: true
})
export class FormatHourPipe implements PipeTransform {

  transform(value: Date | string): string {
    if (!value) return value as string; 

    let date: Date;

    if (typeof value === 'string') {
      date = new Date(value);
    } else {
      date = value; 
    }

    if (isNaN(date.getTime())) {
      return value as string; 
    }

    const hours = date.getHours();
    const minutes = date.getMinutes();

    return `${this.pad(hours)}:${this.pad(minutes)}`;
  }

  private pad(num: number): string {
    return num < 10 ? '0' + num : num.toString(); 
  }
}