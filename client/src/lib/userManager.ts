// User and profile data management using localStorage

export interface UserProfile {
  name: string;
  email: string;
  studentId: string;
  phone?: string;
  major?: string;
  bio?: string;
  joinedDate: string;
  ranking: number;
  totalPoints: number;
  achievements: Achievement[];
  certificates: Certificate[];
  clubs: JoinedClub[];
  awards: Award[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  icon: string;
}

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
}

export interface JoinedClub {
  id: string;
  name: string;
  role: string;
  joinedDate: string;
  logoUrl?: string;
}

export interface Award {
  id: string;
  title: string;
  category: string;
  date: string;
}

export interface StoredUser {
  studentId: string;
  password: string; // In production, this should be hashed
  email: string;
  profile: UserProfile;
}

const USERS_STORAGE_KEY = "gehu_users";
const CURRENT_USER_KEY = "gehu_current_user";

// Get all users from localStorage
function getAllUsers(): { [key: string]: StoredUser } {
  const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
  return usersJson ? JSON.parse(usersJson) : {};
}

// Save all users to localStorage
function saveAllUsers(users: { [key: string]: StoredUser }): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

// Create a default profile for a new user
function createDefaultProfile(
  name: string,
  email: string,
  studentId: string,
  major: string = "Computer Science"
): UserProfile {
  return {
    name,
    email,
    studentId,
    phone: "",
    major,
    bio: "Welcome to GEHU Clubs! Update your profile to get started.",
    joinedDate: new Date().toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }),
    ranking: 999, // New users start with high ranking number (lower is better)
    totalPoints: 0,
    achievements: [],
    certificates: [],
    clubs: [],
    awards: [],
  };
}

// Sign up a new user
export function signupUser(
  name: string,
  email: string,
  studentId: string,
  password: string,
  major?: string
): { success: boolean; message: string } {
  const users = getAllUsers();

  // Check if student ID already exists
  if (users[studentId]) {
    return {
      success: false,
      message: "Student ID already registered. Please login instead.",
    };
  }

  // Check if email already exists
  const emailExists = Object.values(users).some((user) => user.email === email);
  if (emailExists) {
    return {
      success: false,
      message: "Email already registered. Please use a different email.",
    };
  }

  // Create new user
  const newUser: StoredUser = {
    studentId,
    password,
    email,
    profile: createDefaultProfile(name, email, studentId, major),
  };

  users[studentId] = newUser;
  saveAllUsers(users);

  return {
    success: true,
    message: "Account created successfully!",
  };
}

// Login user
export function loginUser(
  studentId: string,
  password: string
): { success: boolean; message: string; user?: UserProfile } {
  const users = getAllUsers();
  const user = users[studentId];

  if (!user) {
    return {
      success: false,
      message: "Student ID not found. Please signup first.",
    };
  }

  if (user.password !== password) {
    return {
      success: false,
      message: "Incorrect password.",
    };
  }

  // Store current logged-in user
  sessionStorage.setItem(CURRENT_USER_KEY, studentId);

  return {
    success: true,
    message: "Login successful!",
    user: user.profile,
  };
}

// Get current logged-in user's profile
export function getCurrentUserProfile(): UserProfile | null {
  const studentId = sessionStorage.getItem(CURRENT_USER_KEY);
  if (!studentId) return null;

  const users = getAllUsers();
  const user = users[studentId];

  return user ? user.profile : null;
}

// Get logged-in user's student ID
export function getLoggedInStudentId(): string | null {
  return sessionStorage.getItem(CURRENT_USER_KEY);
}

// Update user profile
export function updateUserProfile(studentId: string, updates: Partial<UserProfile>): boolean {
  const users = getAllUsers();
  const user = users[studentId];

  if (!user) return false;

  user.profile = { ...user.profile, ...updates };
  saveAllUsers(users);

  return true;
}

// Logout current user
export function logoutUser(): void {
  sessionStorage.removeItem(CURRENT_USER_KEY);
}

// Check if user exists
export function userExists(studentId: string): boolean {
  const users = getAllUsers();
  return !!users[studentId];
}

// Get user by student ID (for admin/verification purposes)
export function getUserByStudentId(studentId: string): UserProfile | null {
  const users = getAllUsers();
  const user = users[studentId];
  return user ? user.profile : null;
}

// Initialize with sample data (optional, for testing)
export function initializeSampleUsers(): void {
  const users = getAllUsers();
  
  // Only initialize if empty
  if (Object.keys(users).length > 0) return;

  const sampleUsers: { [key: string]: StoredUser } = {
    "2025CS1001": {
      studentId: "2025CS1001",
      password: "password123",
      email: "aman.verma@gehu.ac.in",
      profile: {
        name: "Aman Verma",
        email: "aman.verma@gehu.ac.in",
        studentId: "2025CS1001",
        phone: "+91 98765 43210",
        major: "Computer Science",
        bio: "Passionate about tech and community engagement.",
        joinedDate: "Aug 2023",
        ranking: 15,
        totalPoints: 4850,
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
        ],
        certificates: [
          {
            id: "1",
            title: "Web Development Workshop",
            issuer: "Tech Club",
            date: "Sep 2024",
          },
        ],
        clubs: [
          {
            id: "1",
            name: "Tech Club",
            role: "Vice President",
            joinedDate: "Aug 2023",
          },
        ],
        awards: [
          {
            id: "1",
            title: "Best Organizer",
            category: "Events",
            date: "Nov 2024",
          },
        ],
      },
    },
  };

  saveAllUsers(sampleUsers);
}
