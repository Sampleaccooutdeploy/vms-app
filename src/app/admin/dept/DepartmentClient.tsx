"use client";

import { useState, useMemo } from "react";
import { approveVisitor } from "@/app/actions/approve";
import {
    UserIcon,
    BuildingOfficeIcon,
    PhoneIcon,
    CheckBadgeIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    XMarkIcon
} from "@heroicons/react/24/outline";
import styles from "./page.module.css";
import { CustomDialog } from "@/components/ui/CustomDialog";

interface VisitorRequest {
    id: string;
    name: string;
    designation: string | null;
    organization: string | null;
    phone: string | null;
    email: string | null;
    purpose: string | null;
    photo_url: string | null;
    department: string | null;
    created_at: string | null;
    visitor_uid: string | null;
    status: string | null;
}

interface DepartmentClientProps {
    pendingRequests: VisitorRequest[];
    approvedVisitors: VisitorRequest[];
}

import { resendVisitorEmail } from "@/app/actions/resend";
import { ArrowPathIcon, ExclamationTriangleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

// ... previous imports

export default function DepartmentClient({ pendingRequests, approvedVisitors }: DepartmentClientProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedVisitor, setSelectedVisitor] = useState<VisitorRequest | null>(null);
    const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");

    // Loading States
    const [isApproving, setIsApproving] = useState(false);
    const [isResending, setIsResending] = useState(false);

    // Notification Dialog
    const [notification, setNotification] = useState<{ open: boolean, title: string, message: string, type: 'success' | 'error' }>({ open: false, title: "", message: "", type: "success" });

    // Filter logic based on active tab - Memoized for performance
    const filteredRequests = useMemo(() => {
        const currentList = activeTab === "pending" ? pendingRequests : approvedVisitors;
        return currentList.filter(req =>
            (req.name && req.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (req.organization && req.organization.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (req.phone && req.phone.includes(searchTerm))
        );
    }, [activeTab, pendingRequests, approvedVisitors, searchTerm]);

    // Custom Approve Handler to show loading
    const handleApprove = async (formData: FormData) => {
        setIsApproving(true);
        try {
            await approveVisitor(formData);
            setSelectedVisitor(null);
            setNotification({ open: true, title: "Success", message: "Visitor approved successfully", type: "success" });
        } catch (error) {
            setNotification({ open: true, title: "Error", message: "Failed to approve visitor", type: "error" });
        } finally {
            setIsApproving(false);
        }
    };

    // Resend Handler
    const handleResendEmail = async () => {
        if (!selectedVisitor) return;
        setIsResending(true);
        const formData = new FormData();
        formData.append("id", selectedVisitor.id);

        try {
            const result = await resendVisitorEmail(formData);
            if (result.success) {
                setNotification({ open: true, title: "Email Sent", message: "Approval email resent successfully.", type: "success" });
            } else {
                setNotification({ open: true, title: "Error", message: result.message || "Failed to resend email", type: "error" });
            }
        } catch (error) {
            setNotification({ open: true, title: "Error", message: "Unexpected error occurred", type: "error" });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div>
            {/* Notification Dialog */}
            <CustomDialog
                open={notification.open}
                onOpenChange={(open) => setNotification(prev => ({ ...prev, open }))}
                title={notification.title}
                description={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {notification.type === 'success' ? <CheckCircleIcon style={{ width: 24, color: 'green' }} /> : <ExclamationTriangleIcon style={{ width: 24, color: 'red' }} />}
                        {notification.message}
                    </div>
                }
            >
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button className="btn btn-primary" onClick={() => setNotification(prev => ({ ...prev, open: false }))}>OK</button>
                </div>
            </CustomDialog>

            {/* Tabs & Search ... (Same as before) */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === "pending" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("pending")}
                >
                    Pending Requests ({pendingRequests.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "approved" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("approved")}
                >
                    Approved ({approvedVisitors.length})
                </button>
            </div>

            <div className={styles.filterBar}>
                {/* ... Search ... */}
                <div className={styles.searchWrapper}>
                    <MagnifyingGlassIcon className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search by name, org, or phone..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className={styles.stats}>
                    <span>{filteredRequests.length} {activeTab === "pending" ? "Pending" : "Approved"}</span>
                </div>
            </div>


            <div className={styles.requestGrid}>
                {filteredRequests.length === 0 && (
                    <div className={styles.emptyState}>
                        <CheckBadgeIcon className={styles.emptyIcon} style={{ width: 48, height: 48 }} />
                        <p>{searchTerm ? "No matching requests found." : activeTab === "pending" ? "No pending requests." : "No approved visitors yet."}</p>
                    </div>
                )}

                {filteredRequests.map((req) => (
                    <div key={req.id} className={styles.card} onClick={() => setSelectedVisitor(req)}>
                        <div className={styles.cardHeader}>
                            <img
                                src={req.photo_url || "/placeholder-user.png"}
                                alt={req.name}
                                className={styles.visitorPhoto}
                            />
                            <div className={styles.visitorInfo}>
                                <h3>{req.name}</h3>
                                <p className={styles.designation}>{req.designation}</p>
                                <div className={styles.iconText}>
                                    <BuildingOfficeIcon className={styles.miniIcon} />
                                    <span>{req.organization}</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.cardBody}>
                            <div className={styles.infoRow}>
                                <PhoneIcon className={styles.miniIcon} />
                                <span>{req.phone}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <strong>Purpose:</strong> <span className={styles.truncate}>{req.purpose}</span>
                            </div>
                            {activeTab === "approved" && req.visitor_uid && (
                                <div className={styles.approvedInfo}>
                                    <div className={styles.uidBadge}>
                                        <CheckBadgeIcon style={{ width: 16, height: 16 }} />
                                        <span>UID: {req.visitor_uid}</span>
                                    </div>
                                    <div className={styles.timestamp}>
                                        Approved: {req.created_at ? new Date(req.created_at).toLocaleString('en-IN', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short'
                                        }) : 'N/A'}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Card Footer Actions */}
                        {activeTab === "pending" && (
                            <div className={styles.cardFooter}>
                                <form action={handleApprove} onClick={(e) => e.stopPropagation()}>
                                    <input type="hidden" name="id" value={req.id} />
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ width: "100%", display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                        disabled={isApproving}
                                    >
                                        {isApproving ? (
                                            <>
                                                <ArrowPathIcon className="animate-spin" style={{ width: 18, height: 18 }} />
                                                Processing...
                                            </>
                                        ) : "Approve Request"}
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === "approved" && (
                            <div className={styles.cardFooter}>
                                <div className={styles.approvedBadge}>
                                    <CheckBadgeIcon style={{ width: 18, height: 18 }} />
                                    Approved
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Full Profile Dialog */}
            <CustomDialog
                open={!!selectedVisitor}
                onOpenChange={(open) => !open && setSelectedVisitor(null)}
                title="Visitor Profile"
                description={`Full details for ${selectedVisitor?.name}`}
            >
                {selectedVisitor && (
                    <div className={styles.profileModal}>
                        <div className={styles.profileHeader}>
                            <img src={selectedVisitor.photo_url || "/placeholder-user.png"} alt={selectedVisitor.name} className={styles.largePhoto} />
                            <div>
                                <h2>{selectedVisitor.name}</h2>
                                <p className={styles.badge}>{selectedVisitor.designation}</p>
                            </div>
                        </div>

                        <div className={styles.profileGrid}>
                            {/* ... Profile Items ... */}
                            <div className={styles.profileItem}>
                                <label>Organization</label>
                                <p>{selectedVisitor.organization}</p>
                            </div>
                            <div className={styles.profileItem}>
                                <label>Department</label>
                                <p>{selectedVisitor.department}</p>
                            </div>
                            <div className={styles.profileItem}>
                                <label>Phone</label>
                                <p>{selectedVisitor.phone}</p>
                            </div>
                            <div className={styles.profileItem}>
                                <label>Email</label>
                                <p>{selectedVisitor.email}</p>
                            </div>
                            <div className={styles.profileItem} style={{ gridColumn: 'span 2' }}>
                                <label>Purpose of Visit</label>
                                <p>{selectedVisitor.purpose}</p>
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button className="btn btn-outline" onClick={() => setSelectedVisitor(null)}>Close</button>

                            {selectedVisitor.status === "pending" ? (
                                <form action={handleApprove} style={{ flex: 1 }}>
                                    <input type="hidden" name="id" value={selectedVisitor.id} />
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                        disabled={isApproving}
                                    >
                                        {isApproving ? (
                                            <>
                                                <ArrowPathIcon className="animate-spin" style={{ width: 18, height: 18 }} />
                                                Processing...
                                            </>
                                        ) : "Approve Visitor"}
                                    </button>
                                </form>
                            ) : (
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>

                                    {/* Resend Email Button */}
                                    <button
                                        onClick={handleResendEmail}
                                        className="btn btn-outline"
                                        disabled={isResending}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        {isResending ? (
                                            <ArrowPathIcon className="animate-spin" style={{ width: 16, height: 16 }} />
                                        ) : (
                                            <ArrowPathIcon style={{ width: 16, height: 16 }} />
                                        )}
                                        {isResending ? "Sending..." : "Resend Email"}
                                    </button>

                                    <div className={styles.approvedBadge} style={{ padding: '0.5rem 1rem', background: '#ecfdf5', borderRadius: '8px' }}>
                                        <CheckBadgeIcon style={{ width: 18, height: 18 }} />
                                        Already Approved
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CustomDialog>
        </div>
    );
}
