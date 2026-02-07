
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Instructions:
// 1. Install ts-node and dotenv: npm install -g ts-node && npm install dotenv
// 2. Set your environment variables in .env.local
// 3. Run: npx ts-node seed_users.ts

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const initialPassword = process.env.INITIAL_USER_PASSWORD;

if (!supabaseServiceKey || !initialPassword) {
    console.error("Error: Missing required environment variables.");
    console.error("Ensure SUPABASE_SERVICE_ROLE_KEY and INITIAL_USER_PASSWORD are set in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const users = [
    { email: 'superadmin@scsvmv.ac.in', role: 'super_admin' },
    { email: 'cse.admin@scsvmv.ac.in', role: 'department_admin', department: 'CSE' },
    { email: 'security@scsvmv.ac.in', role: 'security' },
];

async function seedUsers() {
    console.log("Seeding users...");
    // Password used from env var

    // Fetch all existing users once to avoid N+1 queries
    console.log("Fetching existing users...");
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error("Error listing users:", listError.message);
        process.exit(1);
    }
    const userMap = new Map(listData.users.map(u => [u.email, u]));

    for (const user of users) {
        console.log(`Processing ${user.email}...`);

        let userId = null;

        // 1. Check if user already exists
        const existingUser = userMap.get(user.email);

        if (existingUser) {
            console.log(`User ${user.email} already exists.`);
            userId = existingUser.id;
            // Update metadata if needed
            await supabase.auth.admin.updateUserById(userId, {
                user_metadata: { role: user.role, department: user.department }
            });
        } else {
            // Create user
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: initialPassword,
                email_confirm: true,
                user_metadata: { role: user.role, department: user.department }
            });

            if (authError) {
                console.error(`Error creating auth user ${user.email}:`, authError.message);
                continue;
            } else if (authData.user) {
                userId = authData.user.id;
            }
        }

        // 2. Upsert Profile if we have an ID
        if (userId) {
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    email: user.email,
                    role: user.role,
                    department: user.department || null
                });

            if (profileError) {
                console.error(`Error creating profile for ${user.email}:`, profileError.message);
            } else {
                console.log(`Successfully synced profile for ${user.email} (${user.role})`);
            }
        }
    }
    console.log("Seeding complete.");
}

seedUsers();
