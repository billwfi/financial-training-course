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

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'GET') {
    try {
      const store = getStore(STORE_NAME);
      let courseData = await store.get(COURSE_KEY, { type: 'json' });

      if (!courseData) {
        const seedPath = path.join(process.cwd(), 'data', 'course.json');
        courseData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      }

      return { statusCode: 200, headers, body: JSON.stringify(courseData) };
    } catch (err) {
      console.error('GET error:', err);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to load course data' }) };
    }
  }

  if (event.httpMethod === 'POST') {
    try {
      const courseData = JSON.parse(event.body);
      courseData.updatedAt = new Date().toISOString();
      const store = getStore(STORE_NAME);
      await store.setJSON(COURSE_KEY, courseData);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    } catch (err) {
      console.error('POST error:', err);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to save course data' }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
};
