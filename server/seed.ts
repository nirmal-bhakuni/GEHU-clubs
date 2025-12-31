import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { Admin } from "./models/Admin";
import { Club } from "./models/Club";
import { Event } from "./models/Event";
import { Student } from "./models/Student";
import { Achievement } from "./models/Achievement";

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

  // Use fixed UUIDs for consistency
  const techClubId = "f54a2526-787b-4de5-9582-0a42f4aaa61b";
  const debateClubId = "484c2b24-6193-42c1-879b-185457a9598f";
  const artClubId = "181d3e7d-d6cd-4f40-b712-7182fcd77154";
  const businessClubId = "cc71501e-1525-4e3b-959c-f3874db96396";
  const scienceClubId = "485300f0-e4cc-4116-aa49-d60dd19070d8";
  const socialClubId = "ff82f1ca-01be-4bff-b0f5-8a1e44dcf951";

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
      coverImageUrl: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&h=400&fit=crop",
      createdAt: new Date()
    },
    {
      id: debateClubId,
      name: "ARYAVRAT",
      description: "Sharpen your argumentation skills...",
      category: "Academic",
      memberCount: 85,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHSQ26pPoXAi8YKQZQPoLwPeETRdh9ywhCAQ&s",
      coverImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop",
      createdAt: new Date()
    },
    {
      id: artClubId,
      name: "PAPERTECH-GEHU",
      description: "Express yourself through various art forms...",
      category: "Arts",
      memberCount: 95,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRN4okYreu0Yak1U5bjkWeSCRBUuagbLTanHg&s",
      coverImageUrl: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=400&fit=crop",
      createdAt: new Date()
    },
    {
      id: businessClubId,
      name: "Entrepreneurship Hub",
      description: "Connect with fellow entrepreneurs...",
      category: "Business",
      memberCount: 150,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkdkjI3VT0FR0WkyDb_xIOPfPpoULRDPybNA&s",
      coverImageUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=400&fit=crop",
      createdAt: new Date()
    },
    {
      id: scienceClubId,
      name: "CODE_HUNTERS",
      description: "Discover the wonders of science...",
      category: "Academic",
      memberCount: 110,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-SeTgtHQSr0YhjNgYKbk3y_arKfREH0DdNA&s",
      coverImageUrl: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&h=400&fit=crop",
      createdAt: new Date()
    },
    {
      id: socialClubId,
      name: "RANGMANCH",
      description: "Make a difference in our community...",
      category: "Social",
      memberCount: 175,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxB5o3X1zEYYTEL6XAalXWOiubGY_mrVJCvA&s",
      coverImageUrl: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=400&fit=crop",
      createdAt: new Date()
    }
  ];

  for (const clubData of clubsData) {
    const existingClub = await Club.findOne({ name: clubData.name });
    if (!existingClub) {
      await Club.create(clubData);
      console.log(`✅ Created club: ${clubData.name}`);
    } else {
      // Update existing club with correct ID if different
      if (existingClub.id !== clubData.id) {
        await Club.findOneAndUpdate({ name: clubData.name }, { id: clubData.id });
        console.log(`✅ Updated club ID: ${clubData.name}`);
      } else {
        console.log(`⏭️ Club already exists: ${clubData.name}`);
      }
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

  // University admin (no clubId) - migrate from old username if needed
  let existingUniAdmin = await Admin.findOne({ username: "admin" });
  if (!existingUniAdmin) {
    // Check if there's an old "university_admin" account to migrate
    const oldUniAdmin = await Admin.findOne({ username: "university_admin" });
    if (oldUniAdmin) {
      // Update the existing account
      await Admin.findOneAndUpdate(
        { username: "university_admin" },
        { username: "admin" }
      );
      console.log("✅ Migrated university_admin to admin");
      existingUniAdmin = await Admin.findOne({ username: "admin" });
    } else {
      // Create new admin account
      await Admin.create({
        id: randomUUID(),
        username: "admin",
        password: hashedPassword,
        clubId: null
      });
      console.log("✅ Created admin: admin");
    }
  } else {
    console.log("⏭️ Admin already exists: admin");
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

  // Create achievements (only if they don't exist)
  const achievementsData = [
    {
      id: randomUUID(),
      clubId: techClubId,
      title: "IEEE Best Student Chapter Award 2024",
      description: "Recognized as the best student chapter in the region for outstanding technical activities and community engagement.",
      imageUrl: "https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?w=400&h=300&fit=crop",
      achievementDate: "2024-10-15",
      category: "Award",
      createdAt: new Date()
    },
    {
      id: randomUUID(),
      clubId: techClubId,
      title: "Hackathon Winners - TechFest 2024",
      description: "First place in the national level hackathon with an innovative IoT solution for smart agriculture.",
      imageUrl: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400&h=300&fit=crop",
      achievementDate: "2024-09-20",
      category: "Competition",
      createdAt: new Date()
    },
    {
      id: randomUUID(),
      clubId: debateClubId,
      title: "Inter-College Debate Championship",
      description: "Won the regional inter-college debate championship with outstanding performances in parliamentary debate.",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
      achievementDate: "2024-08-30",
      category: "Competition",
      createdAt: new Date()
    },
    {
      id: randomUUID(),
      clubId: artClubId,
      title: "Art Exhibition - People's Choice Award",
      description: "Received the people's choice award at the annual university art exhibition for contemporary digital art series.",
      imageUrl: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop",
      achievementDate: "2024-07-15",
      category: "Award",
      createdAt: new Date()
    },
    {
      id: randomUUID(),
      clubId: businessClubId,
      title: "Startup Incubation Program Success",
      description: "Successfully incubated 5 student startups that raised over ₹50 lakhs in funding through our entrepreneurship program.",
      imageUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=300&fit=crop",
      achievementDate: "2024-11-10",
      category: "Achievement",
      createdAt: new Date()
    },
    {
      id: randomUUID(),
      clubId: scienceClubId,
      title: "Research Paper Publication",
      description: "Published groundbreaking research on AI applications in healthcare in IEEE Transactions journal.",
      imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=300&fit=crop",
      achievementDate: "2024-06-25",
      category: "Publication",
      createdAt: new Date()
    },
    {
      id: randomUUID(),
      clubId: socialClubId,
      title: "Community Service Excellence Award",
      description: "Recognized for outstanding community service with over 5000 hours of volunteer work in local communities.",
      imageUrl: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=300&fit=crop",
      achievementDate: "2024-12-01",
      category: "Award",
      createdAt: new Date()
    }
  ];

  for (const achievementData of achievementsData) {
    const existingAchievement = await Achievement.findOne({ id: achievementData.id });
    if (!existingAchievement) {
      await Achievement.create(achievementData);
      console.log(`✅ Created achievement: ${achievementData.title}`);
    }
  }

  console.log("✅ Database seeding completed successfully!");
}
