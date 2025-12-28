import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { Admin } from "./models/Admin";
import { Club } from "./models/Club";
import { Event } from "./models/Event";
import { Student } from "./models/Student";

async function cleanupDuplicates() {
  console.log("🧹 Cleaning up duplicate data...");

  // Remove duplicate clubs (keep the first occurrence)
  const clubs = await Club.find({});
  const clubNames = new Set();
  for (const club of clubs) {
    if (clubNames.has(club.name)) {
      await Club.findByIdAndDelete(club._id);
      console.log(`🗑️ Removed duplicate club: ${club.name}`);
    } else {
      clubNames.add(club.name);
    }
  }

  // Remove duplicate events (keep the first occurrence)
  const events = await Event.find({});
  const eventTitles = new Set();
  for (const event of events) {
    if (eventTitles.has(event.title)) {
      await Event.findByIdAndDelete(event._id);
      console.log(`🗑️ Removed duplicate event: ${event.title}`);
    } else {
      eventTitles.add(event.title);
    }
  }

  // Remove duplicate admins (keep the first occurrence)
  const admins = await Admin.find({});
  const adminUsernames = new Set();
  for (const admin of admins) {
    if (adminUsernames.has(admin.username)) {
      await Admin.findByIdAndDelete(admin._id);
      console.log(`🗑️ Removed duplicate admin: ${admin.username}`);
    } else {
      adminUsernames.add(admin.username);
    }
  }

  console.log("✅ Duplicate cleanup completed!");
}

export async function seedDatabase() {
  console.log("🔄 Checking if database needs seeding...");

  // Clean up duplicates first
  await cleanupDuplicates();

  // Update existing club admins with clubId if missing or incorrect
  const clubNameToAdmin = {
    'IEEE': 'ieee_admin',
    'ARYAVRAT': 'aryavrat_admin',
    'PAPERTECH-GEHU': 'papertech_admin',
    'Entrepreneurship Hub': 'entrepreneurship_admin',
    'CODE_HUNTERS': 'codehunters_admin',
    'RANGMANCH': 'rangmanch_admin'
  };

  const clubs = await Club.find({});
  for (const club of clubs) {
    if (club.name) {
      const adminUsername = clubNameToAdmin[club.name as keyof typeof clubNameToAdmin];
      if (adminUsername) {
        const admin = await Admin.findOne({ username: adminUsername });
        if (admin) {
          await Admin.findByIdAndUpdate(admin._id, { clubId: club.id });
          console.log(`✅ Updated admin ${adminUsername} with clubId ${club.id}`);
        }
      }
    }
  }

  const adminExists = await Admin.findOne({ username: "rangmanch_admin" });
  if (adminExists) {
    console.log("✅ Database already seeded, skipping...");
    return;
  }

  console.log("🌱 Starting database seeding...");

  const techClubId = randomUUID();
  const debateClubId = randomUUID();
  const artClubId = randomUUID();
  const businessClubId = randomUUID();
  const scienceClubId = randomUUID();
  const socialClubId = randomUUID();

  const hashedPassword = await bcrypt.hash("admin123", 10);
  const studentPassword = await bcrypt.hash("password123", 10);

  // Create clubs (only if they don't exist)
  const clubsData = [
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
  ];

  for (const clubData of clubsData) {
    const existingClub = await Club.findOne({ id: clubData.id });
    if (!existingClub) {
      await Club.create(clubData);
      console.log(`✅ Created club: ${clubData.name}`);
    } else {
      console.log(`⏭️ Club already exists: ${clubData.name}`);
    }
  }

  // Create club admin accounts for each club (only if they don't exist)
  const clubAdmins = [
    { username: "ieee_admin", clubId: techClubId },
    { username: "aryavrat_admin", clubId: debateClubId },
    { username: "papertech_admin", clubId: artClubId },
    { username: "entrepreneurship_admin", clubId: businessClubId },
    { username: "codehunters_admin", clubId: scienceClubId },
    { username: "rangmanch_admin", clubId: socialClubId }
  ];

  for (const adminData of clubAdmins) {
    const existingAdmin = await Admin.findOne({ username: adminData.username });
    if (!existingAdmin) {
      await Admin.create({
        id: randomUUID(),
        username: adminData.username,
        password: hashedPassword,
        clubId: adminData.clubId
      });
      console.log(`✅ Created admin: ${adminData.username}`);
    } else {
      console.log(`⏭️ Admin already exists: ${adminData.username}`);
    }
  }

  // University admin (no clubId)
  const existingUniAdmin = await Admin.findOne({ username: "university_admin" });
  if (!existingUniAdmin) {
    await Admin.create({
      id: randomUUID(),
      username: "university_admin",
      password: hashedPassword,
      clubId: null
    });
    console.log("✅ Created admin: university_admin");
  } else {
    console.log("⏭️ Admin already exists: university_admin");
  }

  // Create events (only if they don't exist)
  const eventsData = [
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
  ];

  for (const eventData of eventsData) {
    const existingEvent = await Event.findOne({ title: eventData.title, clubId: eventData.clubId });
    if (!existingEvent) {
      await Event.create(eventData);
      console.log(`✅ Created event: ${eventData.title}`);
    } else {
      console.log(`⏭️ Event already exists: ${eventData.title}`);
    }
  }

  // Create demo student (only if doesn't exist)
  const existingStudent = await Student.findOne({ email: "student@example.com" });
  if (!existingStudent) {
    await Student.insertMany([
      {
        id: randomUUID(),
        name: "Demo Student",
        email: "student@example.com",
        enrollment: "EN123456789",
        branch: "Computer Science",
        password: studentPassword,
        clubId: techClubId,
        createdAt: new Date()
      }
    ]);
    console.log("✅ Created demo student");
  } else {
    console.log("⏭️ Demo student already exists");
  }

  console.log("✅ Database seeding completed successfully!");
}
