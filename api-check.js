// Polls the server until it responds, then performs API checks.
(async () => {
  const base = 'http://localhost:5000';
  const maxRetries = 20;
  const retryDelay = 500; // ms

  async function waitForServer() {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const res = await fetch(base + '/api/events', { method: 'GET' });
        if (res.ok) return true;
      } catch (e) {
       
      }
      await new Promise((r) => setTimeout(r, retryDelay));
    }
    return false;
  }

  try {
    process.stdout.write('Waiting for backend at ' + base + ' ... ');
    const started = await waitForServer();
    if (!started) {
      console.error('\nBackend did not start in time.');
      process.exit(2);
    }
    console.log('OK');

    const eventsRes = await fetch(base + '/api/events');
    const events = eventsRes.ok ? await eventsRes.json() : { status: eventsRes.status, text: await eventsRes.text() };
    console.log('\n--- /api/events ---');
    console.log(JSON.stringify(events, null, 2));

    const clubsRes = await fetch(base + '/api/clubs');
    const clubs = clubsRes.ok ? await clubsRes.json() : { status: clubsRes.status, text: await clubsRes.text() };
    console.log('\n--- /api/clubs ---');
    console.log(JSON.stringify(clubs, null, 2));

    const loginRes = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    const loginJson = loginRes.ok ? await loginRes.json() : { status: loginRes.status, text: await loginRes.text() };
    console.log('\n--- POST /api/auth/login ---');
    console.log(JSON.stringify(loginJson, null, 2));

    // Extract cookie header and reuse for /api/auth/me
    const setCookie = loginRes.headers.get('set-cookie') || loginRes.headers.get('Set-Cookie');
    console.log('Set-Cookie:', setCookie);

    const meRes = await fetch(base + '/api/auth/me', { headers: setCookie ? { cookie: setCookie } : {} });
    const me = meRes.ok ? await meRes.json() : { status: meRes.status, text: await meRes.text() };
    console.log('\n--- GET /api/auth/me ---');
    console.log(JSON.stringify(me, null, 2));

    process.exit(0);
  } catch (e) {
    console.error('ERROR', e);
    process.exit(2);
  }
})();
