"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function approveVisitor(formData: FormData) {
    const requestId = formData.get("id") as string;

    if (!requestId) {
        throw new Error("Request ID is required");
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
        throw new Error("Unauthorized: Only Department Admins can approve requests.");
    }

    // 2. Fetch the request to verify department match
    const { data: request } = await supabase
        .from("visitor_requests")
        .select("department, name, email")
        .eq("id", requestId)
        .single();

    if (!request || request.department !== profile.department) {
        throw new Error("Unauthorized or Request Not Found");
    }

    // 3. Generate UID
    // UID Format: SCSVMV####M (e.g. SCSVMV1023J)
    // Logic: 
    // - Fixed Prefix: SCSVMV
    // - ####: We can use a sequence or random number for now. Let's use last 4 of timestamp or random.
    // - M: Month Code

    const monthCodes = ["J", "F", "M", "A", "Y", "U", "L", "G", "S", "O", "N", "D"];
    const currentMonthCode = monthCodes[new Date().getMonth()];
    const uniqueNumber = Math.floor(1000 + Math.random() * 9000); // 4 digit random
    const uid = `SCSVMV${uniqueNumber}${currentMonthCode}`;

    // 4. Update Database
    const { error } = await supabase
        .from("visitor_requests")
        .update({
            status: "approved",
            visitor_uid: uid
        })
        .eq("id", requestId);

    if (error) {
        throw new Error("Failed to approve request");
    }

    // 5. Send Email (Local Utility via .env.local for debugging)
    const { sendApprovalEmail } = await import("@/utils/email");
    const emailResult = await sendApprovalEmail(
        request.email || "visitor@example.com",
        request.name,
        uid,
        request.department
    );

    if (!emailResult.success) {
        console.error("Failed to send approval email:", emailResult.error);
    } else {
        console.log("Approval email sent successfully via local SMTP");
    }

    // 6. Revalidate Dashboard
    revalidatePath("/admin/dept");
}
