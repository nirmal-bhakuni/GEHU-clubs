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