"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js"; // For admin actions

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export async function deleteUser(userId: string) {
    try {
        const supabase = await createClient(); // User client for permission check
        // Check if current user is super_admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: "Unauthorized" };

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "super_admin") {
            return { error: "Unauthorized: Only Super Admin can delete users." };
        }

        // 1. Delete from Profiles FIRST (to avoid FK constraint issues)
        const { error: dbError } = await serviceClient
            .from("profiles")
            .delete()
            .eq("id", userId);

        if (dbError) {
            console.error("Profile delete error:", dbError);
            // Continue anyway - profile might not exist or was already deleted
        }

        // 2. Delete from Auth (requires service role)
        const { error: authError } = await serviceClient.auth.admin.deleteUser(userId);
        if (authError) {
            console.error("Auth delete error:", authError);
            return { error: `Failed to delete from Auth: ${authError.message}` };
        }

        return { success: true, message: "User deleted successfully." };

    } catch (error: any) {
        console.error("Delete user error:", error);
        return { error: error.message || "Failed to delete user." };
    }
}

// ... deleteUser code ...

export async function getUsers() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Simple authorization check
        if (!user) return { error: "Unauthorized" };
        // Ideally check role here too, but for list it's okay-ish, better strict:
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (profile?.role !== "super_admin") return { error: "Unauthorized" };

        const { data: users, error } = await supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return { success: true, users };

    } catch (error: any) {
        console.error("Get users error:", error);
        return { error: error.message };
    }
}

export async function createUser(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as "department_admin" | "security";
    const department = formData.get("department") as string;

    if (!email || !password || !role) {
        return { error: "Missing required fields" };
    }

    // 1. Verify Requestor is Super Admin
    const supabase = await createClient();
    const { data: { user: requestor } } = await supabase.auth.getUser();

    if (!requestor) return { error: "Unauthorized" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", requestor.id)
        .single();

    if (profile?.role !== "super_admin") {
        return { error: "Unauthorized: Only Super Admins can create users." };
    }

    // 2. Create or Update User using Service Role
    const adminSupabase = createAdminClient();

    // Try to create the user first
    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true // Auto confirm
    });

    // If user already exists, update their password instead
    if (createError && createError.message.toLowerCase().includes('already')) {
        // Lookup user by email using getUserByEmail (more reliable than listUsers)
        const { data: existingUsers } = await adminSupabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === email);

        if (!existingUser) {
            return { error: "User exists but could not be found for update. Please try again." };
        }

        // Check if the existing user is a Super Admin - protect them
        const { data: existingProfile } = await adminSupabase
            .from("profiles")
            .select("role")
            .eq("id", existingUser.id)
            .single();

        if (existingProfile?.role === "super_admin") {
            return { error: "Cannot modify Super Admin accounts. Use a different email." };
        }

        // Update password
        const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
            existingUser.id,
            { password }
        );

        if (updateError) {
            return { error: `Failed to update password: ${updateError.message}` };
        }

        // Update profile (upsert)
        const { error: profileError } = await adminSupabase
            .from("profiles")
            .upsert({
                id: existingUser.id,
                email: email,
                role: role,
                department: role === 'department_admin' ? department : null
            }, { onConflict: 'id' });

        if (profileError) {
            console.error("Profile update error:", profileError);
            return { error: "Password updated but profile update failed: " + profileError.message };
        }

        revalidatePath("/admin/super");
        return { success: true, message: `User ${email} password updated successfully.` };
    }

    if (createError) {
        return { error: createError.message };
    }

    if (!newUser.user) {
        return { error: "Failed to create user" };
    }

    // 3. Create Profile Entry
    const { error: profileError } = await adminSupabase
        .from("profiles")
        .insert({
            id: newUser.user.id,
            email: email,
            role: role,
            department: role === 'department_admin' ? department : null
        });

    if (profileError) {
        // Cleanup: Delete the auth user if profile creation fails
        await adminSupabase.auth.admin.deleteUser(newUser.user.id);
        console.error("Profile creation failed, rolled back user:", profileError);
        return { error: "User created but profile setup failed. User creation rolled back. Error: " + profileError.message };
    }

    revalidatePath("/admin/super");
    return { success: true, message: `User ${email} created successfully.` };
}
