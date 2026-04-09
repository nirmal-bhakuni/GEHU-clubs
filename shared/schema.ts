export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  durationMinutes?: number;
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
  facultyAssigned?: string;
  phone?: string;
  email?: string;
  eligibility?: string;
  eligibilityYears?: string[];
  memberCount: number;
  logoUrl?: string;
  coverImageUrl?: string;
  isHighlighted?: boolean;
  isFrozen?: boolean;
  frozenAt?: Date;
  frozenBy?: string;
  createdAt?: Date;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventDurationMinutes?: number;
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
  attended?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  attendanceStatus?: 'pending' | 'present' | 'absent';
  attendanceMarkedAt?: Date;
  attendanceMarkedBy?: string;
  registeredAt: Date;
  isFallback?: boolean;
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
  isFallback?: boolean;
}

export interface Achievement {
  id: string;
  clubId: string;
  title: string;
  description: string;
  imageUrl: string;
  achievementDate: string;
  category: string;
  createdAt: Date;
}

export interface ClubLeadership {
  id: string;
  clubId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  phoneNumber: string;
  role: string;
  assignedAt: Date;
}

export interface StudentPoints {
  id: string;
  clubId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  enrollmentNumber: string;
  points: number;
  badges: string[];
  skills: string[];
  lastAwardReason?: string;
  lastUpdated: Date;
}

export interface Message {
  id: string;
  clubId: string;
  senderName: string;
  senderEmail: string;
  enrollmentNumber: string;
  subject: string;
  message: string;
  sentAt: Date;
  read: boolean;
}

export interface ChatGroup {
  id: string;
  name: string;
  type: "club" | "event";
  clubId?: string;
  eventId?: string;
  adminOnlyMessaging?: boolean;
  blockedMembersCount?: number;
  icon: string;
  membersCount: number;
  unreadCount: number;
  isNew: boolean;
  lastMessagePreview: string;
  lastMessageAt: string;
}

export interface ChatMessage {
  id: string;
  chatGroupId: string;
  senderType: "student" | "admin";
  senderId: string;
  senderName: string;
  content: string;
  type: "text" | "image" | "document";
  attachmentUrl?: string;
  attachmentName?: string;
  replyToMessageId?: string;
  replyToSenderName?: string;
  replyToContentPreview?: string;
  isPinned?: boolean;
  pinnedAt?: string;
  pinnedByUserKey?: string;
  isSystem?: boolean;
  systemAction?: string;
  clientRequestId?: string;
  deleted?: boolean;
  deletedAt?: string;
  deletedByUserKey?: string;
  createdAt: string;
}

export interface ClubStory {
  id: string;
  clubId: string;
  clubName: string;
  clubLogo?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "text";
  caption?: string;
  isHighlight?: boolean;
  expiresAt?: string | Date;
  createdAt?: string | Date;
}