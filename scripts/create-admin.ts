#!/usr/bin/env ts-node

/**
 * Create Admin User Script
 * 
 * Usage:
 *   ts-node scripts/create-admin.ts --email admin@ridendine.com --password AdminPassword123!
 * 
 * This script creates a new admin user in the database.
 */

import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

interface AdminUser {
  email: string;
  password: string;
  fullName?: string;
}

async function createAdmin(userData: AdminUser): Promise<void> {
  const pool = new Pool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USER || 'ridendine',
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME || 'ridendine_dev',
  });

  try {
    console.log('🔌 Connecting to database...');

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      [userData.email]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      if (user.role === 'admin') {
        console.log(`❌ Admin user with email ${userData.email} already exists (ID: ${user.id})`);
        process.exit(1);
      } else {
        console.log(`⚠️  User with email ${userData.email} exists but is not an admin (role: ${user.role})`);
        console.log('   Would you like to upgrade this user to admin? (Not implemented - manual DB update required)');
        process.exit(1);
      }
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(userData.password, 10);

    // Insert admin user
    console.log('👤 Creating admin user...');
    const result = await pool.query(
      `INSERT INTO users (
        email,
        password_hash,
        role,
        full_name,
        email_verified,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, role, full_name, created_at`,
      [
        userData.email,
        passwordHash,
        'admin',
        userData.fullName || 'Admin User',
        true, // Admin users are auto-verified
        true,
      ]
    );

    const newAdmin = result.rows[0];

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email:      ${newAdmin.email}`);
    console.log(`🆔 User ID:    ${newAdmin.id}`);
    console.log(`👤 Full Name:  ${newAdmin.full_name}`);
    console.log(`🎭 Role:       ${newAdmin.role}`);
    console.log(`📅 Created:    ${newAdmin.created_at}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔑 You can now log in with these credentials.');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Parse command line arguments
function parseArgs(): AdminUser {
  const args = process.argv.slice(2);
  const userData: Partial<AdminUser> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];

    if (key === 'email') {
      userData.email = value;
    } else if (key === 'password') {
      userData.password = value;
    } else if (key === 'name' || key === 'fullName') {
      userData.fullName = value;
    }
  }

  if (!userData.email || !userData.password) {
    console.error('❌ Error: --email and --password are required');
    console.log('\nUsage:');
    console.log('  ts-node scripts/create-admin.ts --email <email> --password <password> [--name <full name>]');
    console.log('\nExample:');
    console.log('  ts-node scripts/create-admin.ts --email admin@ridendine.com --password Admin123! --name "Admin User"');
    process.exit(1);
  }

  return userData as AdminUser;
}

// Main execution
(async () => {
  try {
    const userData = parseArgs();
    await createAdmin(userData);
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
})();
