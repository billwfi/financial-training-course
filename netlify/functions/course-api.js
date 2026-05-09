const { getStore } = require('@netlify/blobs');
const fs = require('fs');
const path = require('path');

const STORE_NAME = 'course-data';
const COURSE_KEY = 'main-course';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function seedData() {
  const seedPath = path.join(process.cwd(), 'data', 'course.json');
  return JSON.parse(fs.readFileSync(seedPath, 'utf8'));
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Local dev without Blobs configured: fall back to seed file
  const blobsAvailable = !!(process.env.NETLIFY_BLOBS_CONTEXT || process.env.NETLIFY);

  if (event.httpMethod === 'GET') {
    try {
      let courseData;
      if (blobsAvailable) {
        const store = getStore(STORE_NAME);
        courseData = await store.get(COURSE_KEY, { type: 'json' });
      }
      if (!courseData) courseData = seedData();
      return { statusCode: 200, headers, body: JSON.stringify(courseData) };
    } catch (err) {
      console.error('GET error:', err);
      try {
        return { statusCode: 200, headers, body: JSON.stringify(seedData()) };
      } catch {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to load course data' }) };
      }
    }
  }

  if (event.httpMethod === 'POST') {
    try {
      const courseData = JSON.parse(event.body);
      courseData.updatedAt = new Date().toISOString();
      if (blobsAvailable) {
        const store = getStore(STORE_NAME);
        await store.setJSON(COURSE_KEY, courseData);
      } else {
        // Local dev: write back to seed file so changes persist during dev
        const seedPath = path.join(process.cwd(), 'data', 'course.json');
        fs.writeFileSync(seedPath, JSON.stringify(courseData, null, 2));
      }
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    } catch (err) {
      console.error('POST error:', err);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to save course data' }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
};
