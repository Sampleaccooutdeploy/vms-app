"use server";

import { createClient } from "@/utils/supabase/server";

export async function getVisitorLogs() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: "Unauthorized" };

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "super_admin") {
            return { error: "Unauthorized: Only Super Admin can view analytics." };
        }

        const { data: logs, error } = await supabase
            .from("visitor_requests")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching logs:", error);
            return { error: "Failed to fetch logs" };
        }

        return { success: true, logs };
    } catch (error: any) {
        console.error("Analytics error:", error);
        return { error: error.message };
    }
}
