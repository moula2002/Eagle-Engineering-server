import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Service from '../models/Service.js';
import Inquiry from '../models/Inquiry.js';
import Testimonial from '../models/Testimonial.js';
import Setting from '../models/Setting.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    console.log('\x1b[33mCleaning existing database collections...\x1b[0m');
    await User.deleteMany({});
    await Project.deleteMany({});
    await Service.deleteMany({});
    await Inquiry.deleteMany({});
    await Testimonial.deleteMany({});
    await Setting.deleteMany({});

    console.log('\x1b[36mSeeding Admin User...\x1b[0m');
    await User.create({
      name: 'Eagle Administrator',
      email: 'admin@eagleengineering.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+1 (800) 555-EAGLE',
    });

    console.log('\x1b[36mSeeding System Settings...\x1b[0m');
    await Setting.create({
      companyName: 'Eagle Engineering & Contracting',
      tagline: 'Pioneering Structural & Heavy Industrial Engineering Solutions',
      email: 'contact@eagleengineering.com',
      phone: '+1 (800) 555-EAGLE',
      address: '100 Engineering Parkway, Suite 500, Industrial District, TX 75001',
      workingHours: 'Mon - Fri: 8:00 AM - 6:00 PM CST',
      stats: {
        yearsExperience: 25,
        completedProjects: 450,
        expertEngineers: 85,
        clientSatisfaction: 99,
      },
    });

    console.log('\x1b[32m✔ Database Seeding Completed Successfully!\x1b[0m');
    console.log('\x1b[35mAdmin Credentials: admin@eagleengineering.com / Admin@123\x1b[0m');
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31m✖ Error Seeding Database:', error, '\x1b[0m');
    process.exit(1);
  }
};

seedData();
