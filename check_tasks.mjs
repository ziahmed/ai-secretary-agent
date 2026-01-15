import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

const tasks = await db.select().from(schema.tasks);
console.log('Total tasks:', tasks.length);

const now = new Date();
const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

tasks.forEach(task => {
  if (task.deadline) {
    const deadline = new Date(task.deadline);
    const isUpcoming = deadline >= now && deadline <= in48Hours;
    console.log(`\nTask: ${task.title}`);
    console.log(`Deadline: ${deadline.toISOString()}`);
    console.log(`Status: ${task.status}`);
    console.log(`Last reminder: ${task.lastReminderSent || 'Never'}`);
    console.log(`Is upcoming (within 48h): ${isUpcoming}`);
  }
});

await connection.end();
