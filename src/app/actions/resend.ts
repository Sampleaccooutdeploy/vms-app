"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function resendVisitorEmail(formData: FormData) {
    const visitorId = formData.get("id") as string;

    if (!visitorId) {
        return { success: false, message: "Visitor ID is required" };
    }

    const supabase = await createClient();

    // 1. Verify User is Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/login?role=admin");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role, department")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "department_admin") {
        return { success: false, message: "Unauthorized" };
    }

    // 2. Fetch the request
    const { data: request } = await supabase
        .from("visitor_requests")
        .select("department, name, email, visitor_uid, status")
        .eq("id", visitorId)
        .single();

    if (!request || request.department !== profile.department) {
        return { success: false, message: "Request not found or unauthorized" };
    }

    if (request.status !== "approved" || !request.visitor_uid) {
        return { success: false, message: "Visitor is not approved yet" };
    }

    // 3. Send Email
    const { sendApprovalEmail } = await import("@/utils/email");
    const emailResult = await sendApprovalEmail(
        request.email || "visitor@example.com",
        request.name,
        request.visitor_uid,
        request.department
    );

    if (!emailResult.success) {
        console.error("Failed to resend email:", emailResult.error);
        return { success: false, message: "Failed to send email" };
    }

    return { success: true, message: "Email resent successfully" };
}
