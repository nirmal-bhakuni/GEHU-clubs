// Mock student database - in production, this would come from a backend API
interface StudentProfile {
  id: string;
  name: string;
  studentId: string;
  email: string;
  phone: string;
  avatar?: string;
  major: string;
  joinedDate: string;
  bio: string;
  ranking: number;
  totalPoints: number;
}

interface StudentAchievement {
  id: string;
  title: string;
  description: string;
  date: string;
  icon: string;
}

interface StudentCertificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
}

interface JoinedClub {
  id: string;
  name: string;
  role: string;
  joinedDate: string;
  logoUrl?: string;
}

interface StudentAward {
  id: string;
  title: string;
  category: string;
  date: string;
}

interface CompleteStudentData {
  profile: StudentProfile;
  achievements: StudentAchievement[];
  certificates: StudentCertificate[];
  clubs: JoinedClub[];
  awards: StudentAward[];
}

// Sample student data - each student has unique data
const studentDatabase: { [key: string]: CompleteStudentData } = {
  "2025CS1001": {
    profile: {
      id: "2025CS1001",
      name: "Aman Verma",
      studentId: "2025CS1001",
      email: "aman.verma@gehu.ac.in",
      phone: "+91 98765 43210",
      major: "Computer Science",
      joinedDate: "Aug 2023",
      bio: "Passionate about tech and community engagement. Active member in multiple clubs.",
      ranking: 15,
      totalPoints: 4850,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aman",
    },
    achievements: [
      {
        id: "1",
        title: "Event Organizer",
        description: "Organized 5+ successful club events",
        date: "Oct 2024",
        icon: "🎯",
      },
      {
        id: "2",
        title: "Active Member",
        description: "Participated in 20+ club activities",
        date: "Sep 2024",
        icon: "⭐",
      },
      {
        id: "3",
        title: "Top Contributor",
        description: "Contributed to 3 club projects",
        date: "Aug 2024",
        icon: "🚀",
      },
    ],
    certificates: [
      {
        id: "1",
        title: "Web Development Workshop",
        issuer: "Tech Club",
        date: "Sep 2024",
      },
      {
        id: "2",
        title: "Leadership Training",
        issuer: "Student Association",
        date: "Aug 2024",
      },
      {
        id: "3",
        title: "Data Analytics Bootcamp",
        issuer: "Code Hunters",
        date: "Jul 2024",
      },
    ],
    clubs: [
      {
        id: "1",
        name: "Tech Club",
        role: "Vice President",
        joinedDate: "Aug 2023",
        logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=tech",
      },
      {
        id: "2",
        name: "Code Hunters",
        role: "Member",
        joinedDate: "Sep 2023",
        logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=code",
      },
      {
        id: "3",
        name: "Debate Club",
        role: "Active Member",
        joinedDate: "Oct 2023",
        logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=debate",
      },
    ],
    awards: [
      {
        id: "1",
        title: "Best Organizer",
        category: "Events",
        date: "Nov 2024",
      },
      {
        id: "2",
        title: "Most Active Member",
        category: "Engagement",
        date: "Oct 2024",
      },
      {
        id: "3",
        title: "Innovation Award",
        category: "Projects",
        date: "Sep 2024",
      },
    ],
  },
  "2025CS1002": {
    profile: {
      id: "2025CS1002",
      name: "Divya Singh",
      studentId: "2025CS1002",
      email: "divya.singh@gehu.ac.in",
      phone: "+91 98765 43211",
      major: "Computer Science",
      joinedDate: "Sep 2023",
      bio: "Tech enthusiast and community builder. Love organizing events and workshops.",
      ranking: 8,
      totalPoints: 5620,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Divya",
    },
    achievements: [
      {
        id: "1",
        title: "Workshop Leader",
        description: "Led 8+ technical workshops",
        date: "Nov 2024",
        icon: "👩‍🏫",
      },
      {
        id: "2",
        title: "Community Star",
        description: "Mentored 15+ junior members",
        date: "Oct 2024",
        icon: "✨",
      },
      {
        id: "3",
        title: "Project Lead",
        description: "Led 2 major club projects to completion",
        date: "Sep 2024",
        icon: "📋",
      },
    ],
    certificates: [
      {
        id: "1",
        title: "Advanced Python Programming",
        issuer: "Code Hunters",
        date: "Oct 2024",
      },
      {
        id: "2",
        title: "Public Speaking Mastery",
        issuer: "Communication Club",
        date: "Sep 2024",
      },
      {
        id: "3",
        title: "Project Management Essentials",
        issuer: "Tech Club",
        date: "Aug 2024",
      },
    ],
    clubs: [
      {
        id: "1",
        name: "Code Hunters",
        role: "President",
        joinedDate: "Sep 2023",
        logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=code",
      },
      {
        id: "2",
        name: "Tech Club",
        role: "Member",
        joinedDate: "Oct 2023",
        logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=tech",
      },
    ],
    awards: [
      {
        id: "1",
        title: "Club President of the Year",
        category: "Leadership",
        date: "Nov 2024",
      },
      {
        id: "2",
        title: "Best Workshop Organizer",
        category: "Events",
        date: "Oct 2024",
      },
    ],
  },
  "2025ECE2001": {
    profile: {
      id: "2025ECE2001",
      name: "Rohan Patel",
      studentId: "2025ECE2001",
      email: "rohan.patel@gehu.ac.in",
      phone: "+91 98765 43212",
      major: "Electronics & Communications",
      joinedDate: "Nov 2023",
      bio: "Electronics enthusiast focused on IoT and embedded systems.",
      ranking: 25,
      totalPoints: 3420,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan",
    },
    achievements: [
      {
        id: "1",
        title: "IoT Project Winner",
        description: "Won first place in IoT competition",
        date: "Oct 2024",
        icon: "🏆",
      },
      {
        id: "2",
        title: "Circuit Designer",
        description: "Designed and tested 10+ circuits",
        date: "Sep 2024",
        icon: "⚙️",
      },
    ],
    certificates: [
      {
        id: "1",
        title: "Embedded Systems Basics",
        issuer: "Electronics Club",
        date: "Sep 2024",
      },
      {
        id: "2",
        title: "Arduino Programming",
        issuer: "Tech Club",
        date: "Aug 2024",
      },
    ],
    clubs: [
      {
        id: "1",
        name: "Electronics Club",
        role: "Active Member",
        joinedDate: "Nov 2023",
        logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=electronics",
      },
      {
        id: "2",
        name: "Robotics Club",
        role: "Member",
        joinedDate: "Dec 2023",
        logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=robotics",
      },
    ],
    awards: [
      {
        id: "1",
        title: "IoT Innovation Prize",
        category: "Projects",
        date: "Oct 2024",
      },
    ],
  },
};

export function getStudentData(studentId: string): CompleteStudentData | null {
  return studentDatabase[studentId] || null;
}

export function getAllStudentIds(): string[] {
  return Object.keys(studentDatabase);
}
