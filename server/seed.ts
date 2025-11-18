import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { Admin } from "./models/Admin";
import { Club } from "./models/Club";
import { Event } from "./models/Event";
import { Student } from "./models/Student";

export async function seedDatabase() {
  const adminExists = await Admin.findOne({ username: "admin" });
  if (adminExists) return;

  const techClubId = randomUUID();
  const debateClubId = randomUUID();
  const artClubId = randomUUID();
  const businessClubId = randomUUID();
  const scienceClubId = randomUUID();
  const socialClubId = randomUUID();

  const hashedPassword = await bcrypt.hash("admin123", 10);

  await Admin.create({
    id: randomUUID(),
    username: "admin",
    password: hashedPassword,
    clubId: techClubId
  });

  await Club.insertMany([
    {
      id: techClubId,
      name: "IEEE",
      description: "Building innovative solutions...",
      category: "Technology",
      memberCount: 125,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGCvDLx2YLXsTqnLYhQPbyv6wDRXXhNkU7ww&s",
      createdAt: new Date()
    },
    {
      id: debateClubId,
      name: "ARYAVRAT",
      description: "Sharpen your argumentation skills...",
      category: "Academic",
      memberCount: 85,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHSQ26pPoXAi8YKQZQPoLwPeETRdh9ywhCAQ&s",
      createdAt: new Date()
    },
    {
      id: artClubId,
      name: "PAPERTECH-GEHU",
      description: "Express yourself through various art forms...",
      category: "Arts",
      memberCount: 95,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRN4okYreu0Yak1U5bjkWeSCRBUuagbLTanHg&s",
      createdAt: new Date()
    },
    {
      id: businessClubId,
      name: "Entrepreneurship Hub",
      description: "Connect with fellow entrepreneurs...",
      category: "Business",
      memberCount: 150,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkdkjI3VT0FR0WkyDb_xIOPfPpoULRDPybNA&s",
      createdAt: new Date()
    },
    {
      id: scienceClubId,
      name: "CODE_HUNTERS",
      description: "Discover the wonders of science...",
      category: "Academic",
      memberCount: 110,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-SeTgtHQSr0YhjNgYKbk3y_arKfREH0DdNA&s",
      createdAt: new Date()
    },
    {
      id: socialClubId,
      name: "RANGMANCH",
      description: "Make a difference in our community...",
      category: "Social",
      memberCount: 175,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxB5o3X1zEYYTEL6XAalXWOiubGY_mrVJCvA&s",
      createdAt: new Date()
    }
  ]);

  await Event.insertMany([
    {
      id: randomUUID(),
      title: "Web Development Bootcamp",
      description: "Learn modern web development...",
      date: "November 15, 2025",
      time: "9:00 AM - 5:00 PM",
      location: "Engineering Building",
      category: "Bootcamp",
      clubId: techClubId,
      clubName: "IEEE",
      imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUzgijNqFpoWRSWhPKpXOqB-W2ccjhrFBeKw&s",
      createdAt: new Date()
    },
    {
      id: randomUUID(),
      title: "Winter Tech Fest",
      description: "Two-day technology festival...",
      date: "December 20, 2025",
      time: "10:00 AM - 6:00 PM",
      location: "Main Auditorium",
      category: "Festival",
      clubId: techClubId,
      clubName: "IEEE",
      imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSI9p1_QlWws8d3TwlotQjB_Itnxyb_BYoRBQ&s",
      createdAt: new Date()
    }
  ]);

  const studentPassword = await bcrypt.hash("student123", 10);

  await Student.insertMany([
    {
      id: randomUUID(),
      name: "Demo Student",
      email: "student@example.com",
      password: studentPassword,
      clubId: techClubId,
      createdAt: new Date()
    }
  ]);
}
