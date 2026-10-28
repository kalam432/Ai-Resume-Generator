/**
 * Practical test script for API Service
 * 
 * Run this to verify the API service works with the backend:
 * node test-api-service.js
 * 
 * Make sure the backend is running on localhost:8000 first!
 * Note: Requires Node.js 18+ (built-in fetch support)
 */

const API_BASE_URL = 'http://localhost:8000/api';
const BACKEND_URL = 'http://localhost:8000';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(color, ...args) {
  console.log(color + args.join(' ') + COLORS.reset);
}

async function runTests() {
  log(COLORS.blue, '\n=== API Service Integration Tests ===\n');

  // Test 1: Health Check
  log(COLORS.yellow, 'Test 1: Health Check');
  try {
    const health = await checkBackendHealth();
    log(COLORS.green, '✓ Health check passed');
    console.log('  Status:', health.status);
    console.log('  Message:', health.message);
  } catch (error) {
    log(COLORS.red, '✗ Health check failed:', error.message);
    log(COLORS.red, '  Make sure backend is running on localhost:8000');
    process.exit(1);
  }

  // Test 2: Generate Resume (Template Mode)
  log(COLORS.yellow, '\nTest 2: Generate Resume');
  try {
    const resumeData = {
      full_name: 'Test Candidate',
      email: 'test@example.com',
      phone: '555-0000',
      professional_summary: 'Experienced software engineer',
      skills: [
        { name: 'Python', years: 5 },
        { name: 'JavaScript', years: 3 },
      ],
      education: [
        {
          degree: 'BS',
          field: 'Computer Science',
          institution: 'Tech University',
          graduation_year: 2020,
        },
      ],
      experience: [
        {
          position: 'Software Engineer',
          company: 'TechCorp',
          start_year: 2020,
          end_year: null,
          description: 'Developed backend services',
        },
      ],
      experience_level: 'mid',
    };

    const result = await generateResume(resumeData);
    log(COLORS.green, '✓ Resume generation passed');
    console.log('  Message:', result.message);
    console.log('  Resume length:', result.resume_text.length, 'characters');
  } catch (error) {
    log(COLORS.red, '✗ Resume generation failed:', error.message);
  }

  // Test 3: Generate Job Description (Template Mode)
  log(COLORS.yellow, '\nTest 3: Generate Job Description');
  try {
    const jobData = {
      job_title: 'Senior Backend Engineer',
      company_name: 'TechCorp Inc',
      required_skills: ['Python', 'FastAPI', 'PostgreSQL'],
      optional_skills: ['Docker', 'Kubernetes'],
      experience_level: 'senior',
    };

    const result = await generateJobDescription(jobData);
    log(COLORS.green, '✓ Job generation passed');
    console.log('  Message:', result.message);
    console.log('  Job description length:', result.job_description.length, 'characters');
  } catch (error) {
    log(COLORS.red, '✗ Job generation failed:', error.message);
  }

  // Test 4: Analyze Resume Match (Keyword Matching Mode)
  log(COLORS.yellow, '\nTest 4: Analyze Resume Match');
  try {
    const resumeText =
      'Python developer with 5 years of experience. Skilled in FastAPI, PostgreSQL, and Docker.';
    const jobDescription =
      'Senior Backend Engineer. Required: Python, FastAPI, PostgreSQL. Optional: Docker, Kubernetes.';

    const result = await analyzeResumeMatch(resumeText, jobDescription);
    log(COLORS.green, '✓ Match analysis passed');
    console.log('  Match percentage:', result.match_percentage + '%');
    console.log('  Matched skills:', result.matched_skills.length);
    console.log('  Missing skills:', result.missing_skills.length);
    console.log('  Summary:', result.summary);
  } catch (error) {
    log(COLORS.red, '✗ Match analysis failed:', error.message);
  }

  // Test 5: Input Validation - Missing Required Field
  log(COLORS.yellow, '\nTest 5: Input Validation');
  try {
    await generateResume({
      full_name: 'Test',
      // email is missing
      phone: '555-0000',
      skills: [{ name: 'Python' }],
      education: [
        {
          degree: 'BS',
          field: 'CS',
          institution: 'University',
          graduation_year: 2020,
        },
      ],
      experience: [
        {
          position: 'Engineer',
          company: 'Corp',
          start_year: 2020,
          end_year: null,
          description: 'Work',
        },
      ],
    });
    log(COLORS.red, '✗ Validation test failed - should have thrown error');
  } catch (error) {
    log(COLORS.green, '✓ Validation correctly caught missing email');
    console.log('  Error message:', error.message);
  }

  // Test 6: Input Validation - Text Too Short
  log(COLORS.yellow, '\nTest 6: Match Analysis Text Validation');
  try {
    await analyzeResumeMatch('short', 'another short text');
    log(COLORS.red, '✗ Text validation failed - should have thrown error');
  } catch (error) {
    log(COLORS.green, '✓ Validation correctly rejected short text');
    console.log('  Error message:', error.message);
  }

  log(COLORS.blue, '\n=== All Tests Completed ===\n');
}

// Run tests
runTests().catch((error) => {
  log(COLORS.red, 'Unexpected error:', error.message);
  process.exit(1);
});
