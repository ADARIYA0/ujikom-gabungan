export interface Event {
  id: string;
  title: string;
  date: Date;
  startDate: Date;
  endDate: Date;
  time: string;
  location: string;
  flyer: string;
  certificate: string;
  imageUrl: string;
  description: string;
  participants: number;
  capacity: number;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export interface Participant {
  id: string;
  eventId: string;
  name: string;
  email: string;
  attendanceMarked: boolean;
  registrationDate: Date;
}

export interface MonthlyStats {
  month: string;
  events: number;
  participants: number;
}
