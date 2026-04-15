import http from 'k6/http';
import { check, sleep, group } from 'k6';

// Configure the load test options
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 concurrent users
    { duration: '1m', target: 20 },   // Maintain 20 users
    { duration: '15s', target: 0 },   // Cool down to 0
  ],
  // This will give you isolated performance metrics for each specific route
  thresholds: {
    'http_req_duration{name:HealthCheck}': ['p(95)<500'],
    'http_req_duration{name:AuthLogin}': ['p(95)<1000'],
    'http_req_duration{name:FetchExams}': ['p(95)<800'],
    'http_req_duration{name:SaveResponse}': ['p(95)<800'],
  }
};

export default function () {
  // ⚠️ REPLACE WITH YOUR ACTUAL EC2 DOMAIN
  const BASE_URL = 'https://exam.chimeratechnologies.com';

  // -----------------------------------------------------------
  // 1. Health Check (Tests general server connection speed)
  // -----------------------------------------------------------
  group('1. Basic Server Health', function () {
    const res = http.get(`${BASE_URL}/api/health`, { tags: { name: 'HealthCheck' } });
    check(res, { 'server is up': (r) => r.status === 200 || r.status === 404 }); 
    sleep(1); // Wait 1s
  });

  // -----------------------------------------------------------
  // 2. Authentication (Tests Database Query + Password Hashing speed)
  // -----------------------------------------------------------
  group('2. Authentication Flow', function () {
    const payload = JSON.stringify({ email: 'test@example.com', password: 'password123' });
    const res = http.post(`${BASE_URL}/api/auth/login`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'AuthLogin' }
    });
    // Even if it fails auth (401), we still measure HOW FAST the server rejected it
    check(res, { 'login processed': (r) => r.status === 200 || r.status === 400 || r.status === 401 });
    sleep(1);
  });

  // -----------------------------------------------------------
  // 3. Fetching Exams (Tests Database Read speed)
  // -----------------------------------------------------------
  group('3. Fetching Exam Data', function () {
    const res = http.get(`${BASE_URL}/api/exams/active`, { tags: { name: 'FetchExams' } });
    check(res, { 'exams fetched': (r) => r.status === 200 || r.status === 401 || r.status === 403 || r.status === 404 });
    sleep(2);
  });

  // -----------------------------------------------------------
  // 4. Submit Answers (Tests Database Write speed)
  // -----------------------------------------------------------
  group('4. Submitting Exam Answers', function () {
    const payload = JSON.stringify({ questionId: 'q1', answer: 'A' });
    const res = http.post(`${BASE_URL}/api/responses/save`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'SaveResponse' } 
    });
    check(res, { 'submission processed': (r) => r.status === 200 || r.status === 401 || r.status === 403 || r.status === 404 });
    sleep(1);
  });
}
