export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  clubId: string;
  clubName: string;
  imageUrl?: string;
  createdAt?: Date;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  logoUrl?: string;
  createdAt?: Date;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  clubName: string;
  studentName: string;
  studentEmail: string;
  enrollmentNumber: string;
  phone: string;
  rollNumber: string;
  department: string;
  year: string;
  interests: string[];
  experience?: string;
  registeredAt: Date;
}

export interface ClubMembership {
  id: string;
  clubId: string;
  clubName: string;
  studentName: string;
  studentEmail: string;
  enrollmentNumber: string;
  department: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  joinedAt: Date;
}