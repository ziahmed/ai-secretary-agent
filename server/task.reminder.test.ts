import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Task Reminder Generation', () => {
  let testTaskId: number;

  beforeAll(async () => {
    // Create a test task with deadline tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const task = await db.createTask({
      title: 'Test Task - Reminder System',
      description: 'This is a test task to verify the reminder system works correctly',
      deadline: tomorrow,
      priority: 'high',
      status: 'open',
      ownerEmail: 'ziaamed@gmail.com',
      createdBy: 1
    });

    testTaskId = task.id;
    console.log('✅ Created test task with ID:', testTaskId, 'Deadline:', tomorrow.toISOString());
  });

  it('should find tasks with upcoming deadlines', async () => {
    const allTasks = await db.getAllTasks();
    console.log('Total tasks in database:', allTasks.length);

    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const tasksNeedingReminders = allTasks.filter(task => {
      if (!task.deadline) return false;
      if (task.status === 'completed') return false;

      const deadline = new Date(task.deadline);
      const isApproachingDeadline = deadline >= now && deadline <= in48Hours;

      console.log(`Task "${task.title}": deadline=${deadline.toISOString()}, approaching=${isApproachingDeadline}`);

      return isApproachingDeadline;
    });

    console.log('Tasks needing reminders:', tasksNeedingReminders.length);
    expect(tasksNeedingReminders.length).toBeGreaterThan(0);
    expect(tasksNeedingReminders.some(t => t.id === testTaskId)).toBe(true);
  });

  it('should have the test task with correct deadline', async () => {
    const task = await db.getTaskById(testTaskId);
    expect(task).toBeDefined();
    expect(task?.deadline).toBeDefined();

    const deadline = new Date(task!.deadline!);
    const now = new Date();
    const hoursDiff = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    console.log('Hours until deadline:', hoursDiff);
    expect(hoursDiff).toBeGreaterThan(0);
    expect(hoursDiff).toBeLessThan(48);
  });
});
