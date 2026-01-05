/**
 * Test to verify that club admins only see their own club's events
 * Run with: node test-club-isolation-fix.js
 */

const baseURL = "http://localhost:12346";

// Test club admins and their corresponding club IDs
const testAdmins = [
  { username: "aryavrat_admin", password: "admin123", clubId: "484c2b24-6193-42c1-879b-185457a9598f", clubName: "ARYAVRAT" },
  { username: "rangmanch_admin", password: "admin123", clubId: "ff82f1ca-01be-4bff-b0f5-8a1e44dcf951", clubName: "RANGMANCH" },
  { username: "ieee_admin", password: "admin123", clubId: "f54a2526-787b-4de5-9582-0a42f4aaa61b", clubName: "IEEE" },
];

async function testClubAdminIsolation() {
  console.log("🧪 Testing Club Admin Event Isolation...\n");

  for (const admin of testAdmins) {
    console.log(`Testing ${admin.clubName} admin (${admin.username})...`);

    try {
      // Step 1: Login
      const loginRes = await fetch(`${baseURL}/api/auth/club-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: admin.username,
          password: admin.password,
        }),
      });

      if (!loginRes.ok) {
        console.error(`  ❌ Login failed: ${loginRes.status}`);
        continue;
      }

      const loginData = await loginRes.json();
      console.log(`  ✅ Logged in successfully. Admin clubId: ${loginData.admin.clubId}`);

      // Step 2: Fetch events without clubId filter (OLD way - should get all events)
      const allEventsRes = await fetch(`${baseURL}/api/events`, {
        method: "GET",
        credentials: "include",
      });
      const allEvents = await allEventsRes.json();
      console.log(`  📊 Total events in system: ${allEvents.length}`);

      // Step 3: Fetch events with clubId filter (NEW way - should only get this club's events)
      const clubEventsRes = await fetch(`${baseURL}/api/events?clubId=${admin.clubId}`, {
        method: "GET",
        credentials: "include",
      });
      const clubEvents = await clubEventsRes.json();
      console.log(`  📊 Events for ${admin.clubName}: ${clubEvents.length}`);

      // Step 4: Verify all returned events belong to this club
      const wrongClubEvents = clubEvents.filter((e) => e.clubId !== admin.clubId);
      if (wrongClubEvents.length > 0) {
        console.error(
          `  ❌ SECURITY ISSUE: Found ${wrongClubEvents.length} events from other clubs!`
        );
        wrongClubEvents.forEach((e) => {
          console.error(`     - ${e.title} (club: ${e.clubName})`);
        });
      } else {
        console.log(`  ✅ All ${clubEvents.length} events belong to ${admin.clubName}`);
      }

      // Step 5: Logout
      await fetch(`${baseURL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      console.log(`  ✅ Logged out\n`);
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}\n`);
    }
  }

  console.log("✅ Club admin isolation test completed!");
}

// Run the test
testClubAdminIsolation().catch(console.error);
