/**
 * Direct API test - bypasses module import issues
 * Tests the actual backend endpoints without going through apiService module
 */

const BACKEND_URL = 'http://localhost:8000';
const API_BASE = 'http://localhost:8000/api';

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.log(`✗ ${name}: ${error.message}`);
  }
}

async function main() {
  console.log('\n=== API Endpoint Direct Tests ===\n');

  // Test 1: Health check
  await test('Health check endpoint', async () => {
    const res = await fetch(`${BACKEND_URL}/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error('Invalid status');
  });

  // Test 2: Resume generation
  await test('Resume generation endpoint', async () => {
    const payload = {
      full_name: 'Test User',
      email: 'test@example.com',
      phone: '555-1234',
      professional_summary: 'Test',
      skills: [{ name: 'Python', years: 5 }],
      education: [{ degree: 'BS', field: 'CS', institution: 'University', graduation_year: 2020 }],
      experience: [{ position: 'Engineer', company: 'Corp', start_year: 2020, end_year: null, description: 'Work' }],
      experience_level: 'mid',
    };
    const res = await fetch(`${API_BASE}/resumes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.resume_text) throw new Error('No resume_text in response');
    if (!data.message) throw new Error('No message in response');
  });

  // Test 3: Job generation
  await test('Job generation endpoint', async () => {
    const payload = {
      job_title: 'Engineer',
      company_name: 'TechCorp',
      required_skills: ['Python'],
      experience_level: 'mid',
    };
    const res = await fetch(`${API_BASE}/jobs/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.job_description) throw new Error('No job_description in response');
    if (!data.message) throw new Error('No message in response');
  });

  // Test 4: Match analysis
  await test('Match analysis endpoint', async () => {
    const payload = {
      resume_text: 'Python developer with experience',
      job_description: 'Senior Python Developer needed for role',
    };
    const res = await fetch(`${API_BASE}/matcher/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (typeof data.match_percentage !== 'number') throw new Error('No match_percentage in response');
    if (!Array.isArray(data.matched_skills)) throw new Error('No matched_skills in response');
    if (!Array.isArray(data.missing_skills)) throw new Error('No missing_skills in response');
    if (!Array.isArray(data.recommendations)) throw new Error('No recommendations in response');
    if (!data.summary) throw new Error('No summary in response');
  });

  // Test 5: Resume validation - missing email
  await test('Resume validation (missing email)', async () => {
    const payload = {
      full_name: 'Test',
      // email is missing
      phone: '555-1234',
      skills: [{ name: 'Python' }],
      education: [{ degree: 'BS', field: 'CS', institution: 'University', graduation_year: 2020 }],
      experience: [{ position: 'Test', company: 'Test', start_year: 2020, end_year: null, description: 'Test' }],
    };
    const res = await fetch(`${API_BASE}/resumes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) throw new Error('Should have returned error for missing email');
    if (res.status !== 422) throw new Error(`Expected 422, got ${res.status}`);
  });

  // Test 6: Match validation - text too short
  await test('Match validation (text too short)', async () => {
    const payload = {
      resume_text: 'short',
      job_description: 'also short',
    };
    const res = await fetch(`${API_BASE}/matcher/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) throw new Error('Should have returned error for text too short');
    if (res.status !== 422) throw new Error(`Expected 422, got ${res.status}`);
  });

  console.log('\n=== Tests Complete ===\n');
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
