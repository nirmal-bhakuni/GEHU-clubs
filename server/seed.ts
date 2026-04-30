import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { Admin } from "./models/Admin";
import { Club } from "./models/Club";
import { Event } from "./models/Event";
import { Student } from "./models/Student";
import { Achievement } from "./models/Achievement";
import { ClubMembership } from "./models/ClubMembership";
import { EventRegistration } from "./models/EventRegistration";

const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const daysAgo = (days: number) => daysFromNow(-days);

const formatEventDate = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

const getCourseYear = (yearOfAdmission: number) => {
  return String(Math.max(1, Math.min(4, new Date().getFullYear() - yearOfAdmission + 1)));
};

const allowedSeedSections = ["A1", "A2", "B1", "B2", "C1", "C2", "A", "B", "C"];
const isAllowedSeedSection = (value?: string) => allowedSeedSections.includes(String(value || "").trim().toUpperCase());
const normalizeSeedSemester = (value: unknown, fallbackIndex = 0) => {
  const raw = String(value || "").trim();
  const numeric = raw.match(/([1-8])/);
  return numeric ? `Semester ${numeric[1]}` : `Semester ${(fallbackIndex % 8) + 1}`;
};

async function seedCampusDemoData(studentPassword: string, adminPassword: string) {
  console.log("🌱 Syncing realistic campus demo data...");

  const richClubs = [
    {
      id: "f54a2526-787b-4de5-9582-0a42f4aaa61b",
      name: "IEEE",
      description: "Technical chapter for electronics, software, robotics, and research-driven engineering projects.",
      category: "Technology",
      facultyAssigned: "Dr. Kavita Bhandari",
      phone: "+91 94111 22001",
      email: "ieee@gehu.ac.in",
      eligibility: "Open to B.Tech students interested in engineering projects, coding, electronics, and research.",
      eligibilityYears: ["1", "2", "3", "4"],
      memberCount: 0,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGCvDLx2YLXsTqnLYhQPbyv6wDRXXhNkU7ww&s",
      coverImageUrl: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&h=400&fit=crop",
      isHighlighted: true,
      createdAt: daysAgo(180),
    },
    {
      id: "485300f0-e4cc-4116-aa49-d60dd19070d8",
      name: "CODE_HUNTERS",
      description: "Competitive programming, hackathons, app development, and interview-prep community for builders.",
      category: "Academic",
      facultyAssigned: "Prof. Anil Nautiyal",
      phone: "+91 94111 22002",
      email: "codehunters@gehu.ac.in",
      eligibility: "Priority for B.Tech CSE, AIML, Data Science, Cyber Security, and IT students.",
      eligibilityYears: ["1", "2", "3", "4"],
      memberCount: 0,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-SeTgtHQSr0YhjNgYKbk3y_arKfREH0DdNA&s",
      coverImageUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&h=400&fit=crop",
      isHighlighted: true,
      createdAt: daysAgo(170),
    },
    {
      id: "d5f4f6d0-8c8e-4fe0-8f2b-e86a22f7fd50",
      name: "GEHU Sports Council",
      description: "University sports club for cricket, football, badminton, athletics, volleyball, and fitness events.",
      category: "Sports",
      facultyAssigned: "Coach Manish Rawat",
      phone: "+91 94111 22007",
      email: "sports@gehu.ac.in",
      eligibility: "Open to all students; B.Tech teams are prioritised for inter-department leagues.",
      eligibilityYears: ["1", "2", "3", "4"],
      memberCount: 0,
      logoUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=300&h=300&fit=crop",
      coverImageUrl: "https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=800&h=400&fit=crop",
      isHighlighted: true,
      createdAt: daysAgo(150),
    },
    {
      id: "b17945d6-c7ef-4569-a645-8e251c2fe971",
      name: "E-Sports Arena",
      description: "Strategy, gaming, streaming, and digital tournament club for students who love competitive e-sports.",
      category: "Sports",
      facultyAssigned: "Mr. Saurabh Joshi",
      phone: "+91 94111 22008",
      email: "esports@gehu.ac.in",
      eligibility: "Open to students with interest in team gaming, event production, design, or commentary.",
      eligibilityYears: ["1", "2", "3", "4"],
      memberCount: 0,
      logoUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=300&fit=crop",
      coverImageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=400&fit=crop",
      isHighlighted: false,
      createdAt: daysAgo(140),
    },
    {
      id: "7b64241a-04e6-4789-b75e-c0203dd7d6f1",
      name: "Cultural Collective",
      description: "Music, dance, anchoring, photography, and campus-fest production for expressive students.",
      category: "Cultural",
      facultyAssigned: "Dr. Nisha Pandey",
      phone: "+91 94111 22009",
      email: "culture@gehu.ac.in",
      eligibility: "Open to all branches and years; auditions are conducted for performance teams.",
      eligibilityYears: ["1", "2", "3", "4"],
      memberCount: 0,
      logoUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop",
      coverImageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=400&fit=crop",
      isHighlighted: false,
      createdAt: daysAgo(130),
    },
  ];

  for (const club of richClubs) {
    await Club.findOneAndUpdate(
      { id: club.id },
      { $set: club },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const extraAdmins = [
    { username: "sports_admin", clubId: "d5f4f6d0-8c8e-4fe0-8f2b-e86a22f7fd50", fullName: "Manish Rawat", email: "sports.admin@gehu.ac.in" },
    { username: "esports_admin", clubId: "b17945d6-c7ef-4569-a645-8e251c2fe971", fullName: "Saurabh Joshi", email: "esports.admin@gehu.ac.in" },
    { username: "culture_admin", clubId: "7b64241a-04e6-4789-b75e-c0203dd7d6f1", fullName: "Nisha Pandey", email: "culture.admin@gehu.ac.in" },
  ];

  for (const admin of extraAdmins) {
    await Admin.findOneAndUpdate(
      { username: admin.username },
      {
        $setOnInsert: {
          id: randomUUID(),
          password: adminPassword,
          phone: "+91 94111 23000",
          role: "club_admin",
          isActive: true,
        },
        $set: {
          clubId: admin.clubId,
          fullName: admin.fullName,
          email: admin.email,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const students = [
    ["Aarav Negi", "aarav.negi26@gehu.edu.in", "GEHU-BT-2023-001", "BT23CSE001", "Computer Science Engineering", "A1", 2023, "Semester 6", "+91 98765 12001", "Full-stack web, cricket, technical anchoring"],
    ["Zoya Khan", "zoya.khan26@gehu.edu.in", "GEHU-BT-2024-002", "BT24AIML002", "Computer Science and Engineering (AI & ML)", "A2", 2024, "Semester 4", "+91 98765 12002", "Machine learning, badminton, debate"],
    ["Devansh Rawat", "devansh.rawat26@gehu.edu.in", "GEHU-BT-2022-003", "BT22DS003", "Computer Science and Engineering (Data Science)", "B1", 2022, "Semester 8", "+91 98765 12003", "Data visualisation, football analytics"],
    ["Mitali Sen", "mitali.sen26@gehu.edu.in", "GEHU-BT-2023-004", "BT23CY004", "Computer Science and Engineering (Cyber Security)", "B2", 2023, "Semester 6", "+91 98765 12004", "CTFs, e-sports strategy, photography"],
    ["Kabir Arora", "kabir.arora26@gehu.edu.in", "GEHU-BT-2024-005", "BT24IT005", "Information Technology", "C1", 2024, "Semester 4", "+91 98765 12005", "Cloud apps, volleyball, stage management"],
    ["Saanvi Joshi", "saanvi.joshi26@gehu.edu.in", "GEHU-BT-2023-006", "BT23ECE006", "Electronics and Communication Engineering", "C2", 2023, "Semester 6", "+91 98765 12006", "IoT, robotics, athletics"],
    ["Ishaan Thapa", "ishaan.thapa26@gehu.edu.in", "GEHU-BT-2025-007", "BT25CSE007", "Computer Science Engineering", "A", 2025, "Semester 2", "+91 98765 12007", "Python, chess, football"],
    ["Riya Bisht", "riya.bisht26@gehu.edu.in", "GEHU-BT-2024-008", "BT24RA008", "Robotics and Automation", "B", 2024, "Semester 4", "+91 98765 12008", "Robotics, badminton, volunteering"],
    ["Arjun Menon", "arjun.menon26@gehu.edu.in", "GEHU-BT-2022-009", "BT22ME009", "Mechanical Engineering", "C", 2022, "Semester 8", "+91 98765 12009", "CAD, football, event logistics"],
    ["Nandini Verma", "nandini.verma26@gehu.edu.in", "GEHU-BT-2023-010", "BT23CE010", "Civil Engineering", "A1", 2023, "Semester 6", "+91 98765 12010", "Sustainable design, athletics, cultural dance"],
    ["Tenzin Dorjee", "tenzin.dorjee26@gehu.edu.in", "GEHU-BT-2024-011", "BT24EEE011", "Electronics and Electrical Engineering", "A2", 2024, "Semester 4", "+91 98765 12011", "Circuits, table tennis, music production"],
    ["Meera Iyer", "meera.iyer26@gehu.edu.in", "GEHU-BT-2023-012", "BT23BIO012", "Biotechnology Engineering", "B1", 2023, "Semester 6", "+91 98765 12012", "Bioinformatics, debate, badminton"],
    ["Faizan Siddiqui", "faizan.siddiqui26@gehu.edu.in", "GEHU-BT-2025-013", "BT25CSE013", "Computer Science Engineering", "B2", 2025, "Semester 2", "+91 98765 12013", "Competitive programming, futsal"],
    ["Prisha Kapoor", "prisha.kapoor26@gehu.edu.in", "GEHU-BT-2024-014", "BT24DS014", "Computer Science and Engineering (Data Science)", "C1", 2024, "Semester 4", "+91 98765 12014", "Dashboards, theatre, fitness"],
    ["Yuvraj Rana", "yuvraj.rana26@gehu.edu.in", "GEHU-BT-2023-015", "BT23AIML015", "Computer Science and Engineering (AI & ML)", "C2", 2023, "Semester 6", "+91 98765 12015", "NLP, cricket, e-sports"],
    ["Aditi Gurung", "aditi.gurung26@gehu.edu.in", "GEHU-BT-2022-016", "BT22IT016", "Information Technology", "A", 2022, "Semester 8", "+91 98765 12016", "Product design, anchoring, basketball"],
    ["Harshit Mehra", "harshit.mehra26@gehu.edu.in", "GEHU-BT-2024-017", "BT24CSE017", "Computer Science Engineering", "B", 2024, "Semester 4", "+91 98765 12017", "APIs, athletics, photography"],
    ["Sara Ahmed", "sara.ahmed26@gehu.edu.in", "GEHU-BT-2023-018", "BT23ECE018", "Electronics and Communication Engineering", "C", 2023, "Semester 6", "+91 98765 12018", "Embedded systems, badminton, singing"],
    ["Omkar Patil", "omkar.patil26@gehu.edu.in", "GEHU-BT-2025-019", "BT25ME019", "Mechanical Engineering", "A1", 2025, "Semester 2", "+91 98765 12019", "Formula student, football, fitness"],
    ["Kavya Chauhan", "kavya.chauhan26@gehu.edu.in", "GEHU-BT-2024-020", "BT24CY020", "Computer Science and Engineering (Cyber Security)", "A2", 2024, "Semester 4", "+91 98765 12020", "Security labs, debate, chess"],
    ["Lakshay Bansal", "lakshay.bansal26@gehu.edu.in", "GEHU-BCA-2024-021", "BCA24A021", "Computer Applications", "B1", 2024, "Semester 4", "+91 98765 12021", "Frontend design, e-sports, dance"],
    ["Anika Dutta", "anika.dutta26@gehu.edu.in", "GEHU-BBA-2023-022", "BBA23A022", "Business Administration", "B2", 2023, "Semester 6", "+91 98765 12022", "Startups, marketing, event hosting"],
    ["Raghav Nautiyal", "raghav.nautiyal26@gehu.edu.in", "GEHU-BSC-2024-023", "BSC24M023", "Mathematics", "C1", 2024, "Semester 4", "+91 98765 12023", "Statistics, chess, quiz"],
    ["Simran Kaur", "simran.kaur26@gehu.edu.in", "GEHU-MBA-2025-024", "MBA25A024", "Management Studies", "C2", 2025, "Semester 2", "+91 98765 12024", "Operations, cultural curation, badminton"],
  ];

  const studentDocs = [];
  for (let index = 0; index < students.length; index++) {
    const [name, email, enrollment, rollNumber, department, section, yearOfAdmission, currentSemester, phone, interests] = students[index];
    const doc = await Student.findOneAndUpdate(
      { email },
      {
        $setOnInsert: {
          password: studentPassword,
          createdAt: daysAgo(95 - index * 3),
        },
        $set: {
          name,
          email,
          enrollment,
          rollNumber,
          department,
          section,
          yearOfAdmission,
          currentSemester,
          phone,
          lastLogin: index % 5 === 0 ? daysAgo(31 + index) : daysAgo((index % 12) + 1),
          isDisabled: false,
          profilePicture: `https://api.dicebear.com/8.x/personas/svg?seed=${encodeURIComponent(String(name))}`,
          savedClubIds: ["f54a2526-787b-4de5-9582-0a42f4aaa61b", "485300f0-e4cc-4116-aa49-d60dd19070d8"],
          savedEventIds: [],
          notificationPreferences: {
            eventReminders: true,
            attendanceUpdates: true,
            announcements: true,
            certificates: true,
          },
          certificates: index % 4 === 0 ? [{
            title: "Campus Participation Certificate",
            issuedBy: "GEHU Student Affairs",
            issuedDate: daysAgo(20 + index),
            certificateUrl: "https://gehu.ac.in/certificates/demo-participation.pdf",
          }] : [],
          dismissedReminderIds: [],
          interests: String(interests).split(",").map((item) => item.trim()),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    studentDocs.push(doc);
  }

  const eventSeed = [
    ["hackathon-2026", "B.Tech HackSprint 2026", "A 24-hour coding sprint for B.Tech teams building campus-life and smart-city prototypes.", 16, "9:00 AM - 9:00 AM", 1440, "Innovation Lab", "Hackathon", "485300f0-e4cc-4116-aa49-d60dd19070d8", "CODE_HUNTERS", "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=400&fit=crop"],
    ["ai-robotics-lab-2026", "AI x Robotics Build Night", "Hands-on robot navigation challenge with AI model integration and sensor debugging.", 24, "2:00 PM - 7:00 PM", 300, "Robotics Lab", "Workshop", "f54a2526-787b-4de5-9582-0a42f4aaa61b", "IEEE", "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop"],
    ["cyber-ctf-2026", "Cyber Shield CTF", "Beginner-friendly capture-the-flag competition covering web, crypto, forensics, and OSINT.", 38, "10:30 AM - 5:30 PM", 420, "Cyber Security Lab", "Competition", "485300f0-e4cc-4116-aa49-d60dd19070d8", "CODE_HUNTERS", "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop"],
    ["cricket-league-2026", "Inter-Branch Cricket League", "Department cricket league with priority slots for B.Tech branch squads and mixed support teams.", 9, "7:00 AM - 4:00 PM", 540, "GEHU Sports Ground", "Sports", "d5f4f6d0-8c8e-4fe0-8f2b-e86a22f7fd50", "GEHU Sports Council", "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&h=400&fit=crop"],
    ["badminton-open-2026", "Badminton Doubles Open", "Fast-paced doubles tournament for students across branches and years.", 30, "8:30 AM - 2:00 PM", 330, "Indoor Sports Complex", "Sports", "d5f4f6d0-8c8e-4fe0-8f2b-e86a22f7fd50", "GEHU Sports Council", "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&h=400&fit=crop"],
    ["football-night-2026", "Floodlight Football Fiesta", "Five-a-side night football event with branch-based knockout fixtures.", 44, "5:30 PM - 10:30 PM", 300, "Turf Arena", "Sports", "d5f4f6d0-8c8e-4fe0-8f2b-e86a22f7fd50", "GEHU Sports Council", "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=400&fit=crop"],
    ["valorant-arena-2026", "Valorant Campus Cup", "Team-based e-sports tournament with shoutcasting, stream production, and match analytics.", 20, "11:00 AM - 6:00 PM", 420, "Digital Arena", "E-Sports", "b17945d6-c7ef-4569-a645-8e251c2fe971", "E-Sports Arena", "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=800&h=400&fit=crop"],
    ["cultural-night-2026", "Udaan Cultural Night", "Music, dance, theatre, and fashion showcase built around student-led production crews.", 52, "4:00 PM - 9:30 PM", 330, "Main Auditorium", "Cultural", "7b64241a-04e6-4789-b75e-c0203dd7d6f1", "Cultural Collective", "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=400&fit=crop"],
    ["startup-pitch-2026", "Student Startup Pitch Day", "Founders pitch prototypes to faculty mentors, alumni, and incubation partners.", 33, "1:00 PM - 5:00 PM", 240, "Seminar Hall A", "Entrepreneurship", "cc71501e-1525-4e3b-959c-f3874db96396", "Entrepreneurship Hub", "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=400&fit=crop"],
    ["debate-summit-2026", "Aryavrat Policy Debate", "Parliamentary debate rounds on technology policy, sports funding, and student governance.", 27, "10:00 AM - 4:00 PM", 360, "Block B Auditorium", "Debate", "484c2b24-6193-42c1-879b-185457a9598f", "ARYAVRAT", "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=400&fit=crop"],
    ["paper-art-2026", "PaperTech Design Jam", "Poster, zine, and installation challenge using recycled paper and digital typography.", 12, "12:00 PM - 5:00 PM", 300, "Design Studio", "Arts", "181d3e7d-d6cd-4f40-b712-7182fcd77154", "PAPERTECH-GEHU", "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=400&fit=crop"],
    ["athletics-day-2026", "GEHU Athletics Day", "Track, relay, long jump, and fitness challenges for inter-branch sports standings.", -8, "7:30 AM - 1:30 PM", 360, "Athletics Track", "Sports", "d5f4f6d0-8c8e-4fe0-8f2b-e86a22f7fd50", "GEHU Sports Council", "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=400&fit=crop"],
  ];

  const eventDocs = [];
  for (const event of eventSeed) {
    const [id, title, description, offset, time, durationMinutes, location, category, clubId, clubName, imageUrl] = event;
    const eventDate = daysFromNow(Number(offset));
    const doc = await Event.findOneAndUpdate(
      { id },
      {
        $set: {
          id,
          title,
          description,
          date: formatEventDate(eventDate),
          time,
          durationMinutes,
          location,
          category,
          clubId,
          clubName,
          imageUrl,
          createdAt: daysAgo(50 - Math.min(Number(offset), 25)),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    eventDocs.push(doc);
  }

  for (let index = 0; index < studentDocs.length; index++) {
    const student: any = studentDocs[index];
    const preferredClubIds = [
      "485300f0-e4cc-4116-aa49-d60dd19070d8",
      "f54a2526-787b-4de5-9582-0a42f4aaa61b",
      index % 3 === 0 ? "d5f4f6d0-8c8e-4fe0-8f2b-e86a22f7fd50" : index % 3 === 1 ? "7b64241a-04e6-4789-b75e-c0203dd7d6f1" : "b17945d6-c7ef-4569-a645-8e251c2fe971",
    ];

    for (const clubId of [...new Set(preferredClubIds)]) {
      const club: any = richClubs.find((item) => item.id === clubId) || await Club.findOne({ id: clubId });
      if (!club) continue;
      await ClubMembership.findOneAndUpdate(
        { clubId, enrollmentNumber: student.enrollment },
        {
          $setOnInsert: {
            id: randomUUID(),
            joinedAt: daysAgo(80 - (index % 18)),
          },
          $set: {
            clubName: club.name,
            studentName: student.name,
            studentEmail: student.email,
            enrollmentNumber: student.enrollment,
            department: student.department,
            reason: `Interested in ${club.name} activities; strengths include ${student.interests?.slice?.(0, 2)?.join(", ") || "team participation"}.`,
            status: index % 11 === 0 ? "pending" : "approved",
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const eventSlice = eventDocs.filter((_, eventIndex) => (eventIndex + index) % 3 !== 1).slice(0, 7);
    for (let eventIndex = 0; eventIndex < eventSlice.length; eventIndex++) {
      const event: any = eventSlice[eventIndex];
      const attended = new Date(event.date).getTime() < Date.now() || (index + eventIndex) % 4 !== 0;
      await EventRegistration.findOneAndUpdate(
        { eventId: event.id, enrollmentNumber: student.enrollment },
        {
          $setOnInsert: {
            id: randomUUID(),
            registeredAt: daysAgo(35 - ((index + eventIndex) % 24)),
          },
          $set: {
            eventTitle: event.title,
            eventDate: event.date,
            eventTime: event.time,
            eventDurationMinutes: event.durationMinutes || 120,
            clubName: event.clubName,
            studentName: student.name,
            studentEmail: student.email,
            enrollmentNumber: student.enrollment,
            phone: student.phone,
            rollNumber: student.rollNumber,
            course: String(student.department || "").includes("Engineering") ? "B.Tech" : String(student.department || "").split(" ")[0] || "UG",
            department: student.department,
            year: getCourseYear(Number(student.yearOfAdmission || 2024)),
            semester: student.currentSemester || "",
            section: student.section || "",
            interests: student.interests || [],
            experience: `Participated through ${student.section}; comfortable with ${student.interests?.slice?.(0, 2)?.join(" and ") || "team activities"}.`,
            attended,
            status: (index + eventIndex) % 13 === 0 ? "pending" : "approved",
            attendanceStatus: attended ? "present" : "pending",
            attendanceMarkedAt: attended ? daysAgo((index + eventIndex) % 10) : undefined,
            attendanceMarkedBy: attended ? "seed-system" : undefined,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }

  const approvedMemberships = await ClubMembership.aggregate([
    { $match: { status: { $ne: "rejected" } } },
    { $group: { _id: "$clubId", count: { $sum: 1 } } },
  ]);

  for (const item of approvedMemberships) {
    await Club.findOneAndUpdate({ id: item._id }, { $set: { memberCount: item.count } });
  }

  const allStudents = await Student.find({});
  for (let index = 0; index < allStudents.length; index++) {
    const student: any = allStudents[index];
    const safeSection = isAllowedSeedSection(student.section) ? String(student.section).trim().toUpperCase() : allowedSeedSections[index % allowedSeedSections.length];
    const safeSemester = normalizeSeedSemester(student.currentSemester, index);
    await Student.findByIdAndUpdate(student._id, {
      $set: {
        section: safeSection,
        currentSemester: safeSemester,
      },
    });
    await EventRegistration.updateMany(
      { enrollmentNumber: student.enrollment },
      {
        $set: {
          section: safeSection,
          semester: safeSemester,
        },
      },
    );
  }

  const allRegistrations = await EventRegistration.find({});
  for (let index = 0; index < allRegistrations.length; index++) {
    const registration: any = allRegistrations[index];
    const matchingEvent: any = eventDocs.find((event: any) =>
      String(event.id || "") === String(registration.eventId || "") ||
      String(event.title || "") === String(registration.eventTitle || "")
    ) || await Event.findOne({
      $or: [
        { id: registration.eventId },
        { title: registration.eventTitle },
      ],
    });
    const matchingStudent: any = allStudents.find((student: any) =>
      String(student.enrollment || "") === String(registration.enrollmentNumber || registration.studentEnrollment || "") ||
      String(student.email || "").toLowerCase() === String(registration.studentEmail || "").toLowerCase()
    );
    const fallbackSection = allowedSeedSections[index % allowedSeedSections.length];
    const fallbackSemester = normalizeSeedSemester(registration.semester || matchingStudent?.currentSemester, index);
    await EventRegistration.findByIdAndUpdate(registration._id, {
      $set: {
        enrollmentNumber: registration.enrollmentNumber || registration.studentEnrollment || matchingStudent?.enrollment || "",
        section: isAllowedSeedSection(registration.section) ? String(registration.section).trim().toUpperCase() : (matchingStudent?.section || fallbackSection),
        semester: fallbackSemester,
        department: registration.department || matchingStudent?.department || "Computer Science Engineering",
        eventCategory: registration.eventCategory || matchingEvent?.category || "General",
      },
    });
  }

  console.log(`✅ Synced ${students.length} realistic students, ${eventSeed.length} events, memberships, and registrations`);
}

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

  const hashedPassword = await bcrypt.hash("admin123", 10);
  const studentPassword = await bcrypt.hash("password123", 10);

  await seedCampusDemoData(studentPassword, hashedPassword);

  const adminExists = await Admin.findOne({ username: "rangmanch_admin" });
  if (adminExists) {
    console.log("Base seed already exists; rich demo data is up to date.");
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

  // Create clubs (only if they don't exist)
  const clubsData = [
    {
      id: techClubId,
      name: "IEEE",
      description: "Building innovative solutions...",
      category: "Technology",
      memberCount: 0,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGCvDLx2YLXsTqnLYhQPbyv6wDRXXhNkU7ww&s",
      coverImageUrl: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&h=400&fit=crop",
      createdAt: new Date()
    },
    {
      id: debateClubId,
      name: "ARYAVRAT",
      description: "Sharpen your argumentation skills...",
      category: "Academic",
      memberCount: 0,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHSQ26pPoXAi8YKQZQPoLwPeETRdh9ywhCAQ&s",
      coverImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop",
      createdAt: new Date()
    },
    {
      id: artClubId,
      name: "PAPERTECH-GEHU",
      description: "Express yourself through various art forms...",
      category: "Arts",
      memberCount: 0,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRN4okYreu0Yak1U5bjkWeSCRBUuagbLTanHg&s",
      coverImageUrl: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=400&fit=crop",
      createdAt: new Date()
    },
    {
      id: businessClubId,
      name: "Entrepreneurship Hub",
      description: "Connect with fellow entrepreneurs...",
      category: "Business",
      memberCount: 0,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkdkjI3VT0FR0WkyDb_xIOPfPpoULRDPybNA&s",
      coverImageUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=400&fit=crop",
      createdAt: new Date()
    },
    {
      id: scienceClubId,
      name: "CODE_HUNTERS",
      description: "Discover the wonders of science...",
      category: "Academic",
      memberCount: 0,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-SeTgtHQSr0YhjNgYKbk3y_arKfREH0DdNA&s",
      coverImageUrl: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&h=400&fit=crop",
      createdAt: new Date()
    },
    {
      id: socialClubId,
      name: "RANGMANCH",
      description: "Make a difference in our community...",
      category: "Social",
      memberCount: 0,
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

  // Create demo students (only if they don't exist)
  const demoStudents = [
    {
      name: "Aarav Kumar",
      email: "aarav.kumar@gehu.edu",
      enrollment: "EN001",
      branch: "Computer Science",
      password: studentPassword,
      lastLogin: new Date(),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      name: "Priya Sharma",
      email: "priya.sharma@gehu.edu",
      enrollment: "EN002",
      branch: "Electronics Engineering",
      password: studentPassword,
      lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    },
    {
      name: "Rohan Patel",
      email: "rohan.patel@gehu.edu",
      enrollment: "EN003",
      branch: "Computer Science",
      password: studentPassword,
      lastLogin: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    },
    {
      name: "Ananya Verma",
      email: "ananya.verma@gehu.edu",
      enrollment: "EN004",
      branch: "Mechanical Engineering",
      password: studentPassword,
      lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)
    },
    {
      name: "Vikram Singh",
      email: "vikram.singh@gehu.edu",
      enrollment: "EN005",
      branch: "Civil Engineering",
      password: studentPassword,
      lastLogin: new Date(),
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
    },
    {
      name: "Neha Gupta",
      email: "neha.gupta@gehu.edu",
      enrollment: "EN006",
      branch: "Computer Science",
      password: studentPassword,
      lastLogin: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    },
    {
      name: "Arjun Reddy",
      email: "arjun.reddy@gehu.edu",
      enrollment: "EN007",
      branch: "Electronics Engineering",
      password: studentPassword,
      lastLogin: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    },
    {
      name: "Divya Nair",
      email: "divya.nair@gehu.edu",
      enrollment: "EN008",
      branch: "Information Technology",
      password: studentPassword,
      lastLogin: null,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      name: "Karan Malhotra",
      email: "karan.malhotra@gehu.edu",
      enrollment: "EN009",
      branch: "Computer Science",
      password: studentPassword,
      lastLogin: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000)
    },
    {
      name: "Sneha Joshi",
      email: "sneha.joshi@gehu.edu",
      enrollment: "EN010",
      branch: "Mechanical Engineering",
      password: studentPassword,
      lastLogin: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000)
    }
  ];

  let studentsCreated = 0;
  for (const studentData of demoStudents) {
    const existingStudent = await Student.findOne({ email: studentData.email });
    if (!existingStudent) {
      await Student.create(studentData);
      studentsCreated++;
    }
  }
  
  if (studentsCreated > 0) {
    console.log(`✅ Created ${studentsCreated} demo students`);
  } else {
    console.log("⏭️ Demo students already exist");
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

  // Create event registrations for analytics (only if they don't exist)
  const { EventRegistration } = await import("./models/EventRegistration.js");
  
  const allEvents = await Event.find({});
  const allStudents = await Student.find({}).limit(10);
  
  if (allEvents.length > 0 && allStudents.length > 0) {
    const existingRegistrations = await EventRegistration.countDocuments();
    
    if (existingRegistrations === 0) {
      const registrationsToCreate = [];
      
      // For each event, create random registrations from students
      for (const event of allEvents) {
        // Randomly register 5-15 students per event
        const numRegistrations = Math.floor(Math.random() * 11) + 5;
        const shuffledStudents = [...allStudents].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < Math.min(numRegistrations, allStudents.length); i++) {
          const student = shuffledStudents[i];
          // 70% chance of attending
          const attended = Math.random() > 0.3;
          
          registrationsToCreate.push({
            eventId: event.id,
            studentEnrollment: student.enrollment,
            studentName: student.name,
            studentEmail: student.email,
            status: "confirmed",
            attended: attended,
            registeredAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          });
        }
      }
      
      if (registrationsToCreate.length > 0) {
        await EventRegistration.insertMany(registrationsToCreate);
        console.log(`✅ Created ${registrationsToCreate.length} event registrations for analytics`);
      }
    } else {
      console.log("⏭️ Event registrations already exist");
    }
  }

  console.log("✅ Database seeding completed successfully!");
}

