/**
 * Test email functionality
 * Run with: node test-email.js
 */

const baseUrl = "http://localhost:12346";

async function login() {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" }),
    credentials: "include"
  });
  
  const cookies = response.headers.get("set-cookie");
  if (!response.ok) {
    throw new Error("Login failed");
  }
  
  console.log("✅ Logged in as admin");
  return cookies;
}

async function testDirectEmail(cookies) {
  console.log("\n📧 Testing direct email API...");
  
  const response = await fetch(`${baseUrl}/api/test/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookies
    },
    body: JSON.stringify({
      to: "test@example.com",
      subject: "Test Email from GEHU Clubs",
      text: "This is a test email to verify the email service is working.",
      html: "<p><strong>This is a test email</strong> to verify the email service is working.</p>"
    })
  });
  
  const result = await response.json();
  if (response.ok) {
    console.log("✅ Email sent successfully!");
    console.log("   Check the terminal output for the Ethereal preview URL");
  } else {
    console.error("❌ Failed:", result.error);
  }
}

async function createTestEvent(cookies) {
  console.log("\n🎉 Creating a test event (should trigger email)...");
  
  const response = await fetch(`${baseUrl}/api/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookies
    },
    body: JSON.stringify({
      title: "Email Test Event",
      description: "This event was created to test email notifications",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      time: "14:00",
      location: "Main Auditorium",
      category: "Workshop",
      clubId: "484c2b24-6193-42c1-879b-185457a9598f" // ARYAVRAT club
    })
  });
  
  const result = await response.json();
  if (response.ok) {
    console.log("✅ Event created successfully!");
    console.log("   Check the terminal output for the Ethereal preview URL");
    return result.id;
  } else {
    console.error("❌ Failed:", result.error);
  }
}

async function createTestAnnouncement(cookies) {
  console.log("\n📢 Creating a test announcement (should trigger email)...");
  
  const response = await fetch(`${baseUrl}/api/announcements`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookies
    },
    body: JSON.stringify({
      title: "Email Test Announcement",
      content: "This is a test announcement to verify email notifications are working properly.",
      target: "all"
    })
  });
  
  const result = await response.json();
  if (response.ok) {
    console.log("✅ Announcement created successfully!");
    console.log("   Check the terminal output for the Ethereal preview URL");
  } else {
    console.error("❌ Failed:", result.error);
  }
}

async function main() {
  console.log("🚀 Testing GEHU Clubs Email Service\n");
  console.log("📝 This will:");
  console.log("   1. Test direct email sending");
  console.log("   2. Create an event (triggers email to all students)");
  console.log("   3. Create an announcement (triggers email to all students)");
  console.log("\n⏳ Starting tests...\n");
  
  try {
    const cookies = await login();
    await testDirectEmail(cookies);
    await createTestEvent(cookies);
    await createTestAnnouncement(cookies);
    
    console.log("\n✅ All tests completed!");
    console.log("\n🔗 Look for Ethereal preview URLs in your server terminal output");
    console.log("   They look like: https://ethereal.email/message/...");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
  }
}

main();
