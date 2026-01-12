const BASE_URL = 'http://localhost:12346';
let sessionCookie = '';

async function test() {
  try {
    // 1. Login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    
    if (!loginRes.ok) {
      console.log('❌ Login failed');
      return;
    }
    
    const setCookie = loginRes.headers.get('set-cookie');
    if (setCookie) {
      sessionCookie = setCookie.split(';')[0];
      console.log('✅ Login successful');
    }

    // 2. Get all events
    const eventsRes = await fetch(`${BASE_URL}/api/events`);
    if (eventsRes.ok) {
      const events = await eventsRes.json();
      console.log(`✅ Got ${events.length} events`);
      events.forEach(e => console.log(`   - ${e.title} (ID: ${e.id})`));
      
      // Try to get first event detail
      if (events.length > 0) {
        const eventId = events[0].id;
        const detailRes = await fetch(`${BASE_URL}/api/events/${eventId}`);
        if (detailRes.ok) {
          const event = await detailRes.json();
          console.log(`✅ Got event detail for: ${event.title}`);
        } else {
          console.log(`❌ Failed to get event detail: ${detailRes.status}`);
        }
      }
    }

    // 3. Create a new event
    const eventData = {
      title: 'New Test Event',
      description: 'Testing event creation',
      date: '2026-03-01',
      time: '10:00',
      location: 'Lab',
      category: 'Technical',
      clubId: '484c2b24-6193-42c1-879b-185457a9598f'
    };

    const createRes = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': sessionCookie 
      },
      body: JSON.stringify(eventData),
    });

    if (createRes.ok) {
      const newEvent = await createRes.json();
      console.log(`✅ Created event: ${newEvent.title} (ID: ${newEvent.id})`);
      
      // Try to get the newly created event
      const detailRes = await fetch(`${BASE_URL}/api/events/${newEvent.id}`);
      if (detailRes.ok) {
        const retrieved = await detailRes.json();
        console.log(`✅ Retrieved newly created event: ${retrieved.title}`);
      } else {
        console.log(`❌ Failed to retrieve newly created event: ${detailRes.status}`);
      }
    } else {
      console.log(`❌ Failed to create event: ${createRes.status}`);
      const error = await createRes.text();
      console.log(`   Error: ${error.substring(0, 200)}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
