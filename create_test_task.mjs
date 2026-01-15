import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

// Create a task with deadline tomorrow
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(14, 0, 0, 0); // 2 PM tomorrow

const result = await db.insert(schema.tasks).values({
  title: 'Test Task - Reminder System',
  description: 'This is a test task to verify the reminder system works correctly',
  deadline: tomorrow,
  priority: 'high',
  status: 'pending',
  ownerEmail: 'ziaamed@gmail.com',
  createdBy: 1
});

console.log('✅ Test task created successfully!');
console.log('Task ID:', result[0].insertId);
console.log('Deadline:', tomorrow.toISOString());
console.log('\nNow click "Generate Reminders" on the dashboard to test.');

await connection.end();
