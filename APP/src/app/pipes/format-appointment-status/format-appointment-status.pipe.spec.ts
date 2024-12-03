import { FormatAppointmentStatusPipe } from './format-appointment-status.pipe';

describe('FormatAppointmentStatusPipe', () => {
  it('create an instance', () => {
    const pipe = new FormatAppointmentStatusPipe();
    expect(pipe).toBeTruthy();
  });
});
