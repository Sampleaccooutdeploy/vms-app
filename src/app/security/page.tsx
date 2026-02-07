"use client";

import { useState, useEffect } from "react";
// import { createClient } from "@/utils/supabase/client"; // Removed for security
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { MagnifyingGlassIcon, ArrowRightOnRectangleIcon, CheckCircleIcon, QrCodeIcon } from "@heroicons/react/24/outline";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";

// Interface for visitor request
interface VisitorRequest {
    id: string;
    name: string;
    visitor_uid: string;
    photo_url: string;
    status: string;
    department: string;
    purpose: string;
    check_in_time: string | null;
    check_out_time: string | null;
}

import { logout } from "@/app/actions/auth";

export default function SecurityDashboard() {
    // const supabase = createClient(); // Removed
    const router = useRouter();

    // Dashboard State - No PIN Required, Direct Access
    // const [isAuthenticated, setIsAuthenticated] = useState(false); // Removed - direct access
    // const [pinInput, setPinInput] = useState(""); // Removed
    // const [authError, setAuthError] = useState(""); // Removed

    // Dashboard State
    const [uidInput, setUidInput] = useState("");
    const [visitor, setVisitor] = useState<VisitorRequest | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    // No PIN check needed - direct access
    // useEffect removed for PIN auth

    // Scanner Effect
    useEffect(() => {
        if (isScanning) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 150 }, // More rectangular for barcodes
                    aspectRatio: 1.0,
                    formatsToSupport: [Html5QrcodeSupportedFormats.CODE_128]
                },
                /* verbose= */ false
            );

            scanner.render(
                (decodedText) => {
                    // Success callback
                    setUidInput(decodedText);
                    setIsScanning(false);
                    scanner.clear();

                    // Auto submit logic
                    searchVisitor(decodedText);
                },
                (errorMessage) => {
                    // Error callback (ignore frequent scan errors)
                }
            );

            return () => {
                scanner.clear().catch(error => console.error("Failed to clear scanner", error));
            };
        }
    }, [isScanning]);

    // Extracted search logic for auto-submit
    const searchVisitor = async (uid: string) => {
        setLoading(true);
        setMessage(null);
        setVisitor(null);

        try {
            const { getVisitorByUid } = await import("@/app/actions/security");
            const result = await getVisitorByUid(uid);

            if (result.error || !result.visitor) {
                throw new Error(result.error || "Visitor not found or invalid UID.");
            }

            setVisitor(result.visitor as VisitorRequest);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    // PIN authentication removed - direct access enabled

    // ... Search and Action logic ...
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        searchVisitor(uidInput);
    };

    const handleAction = async (action: 'check_in' | 'check_out') => {
        if (!visitor) return;
        setLoading(true);
        setMessage(null);

        try {
            const { updateVisitorStatus } = await import("@/app/actions/security");
            const result = await updateVisitorStatus(visitor.id, action);

            if (result.error) throw new Error(result.error);

            setMessage({
                type: 'success',
                text: result.message || `Visitor ${action === 'check_in' ? 'checked in' : 'checked out'} successfully.`
            });

            // Refresh local state with updates
            if (result.updates) {
                setVisitor(prev => prev ? ({ ...prev, ...result.updates }) : null);
            } else {
                // Fallback optimistic update
                const updates: any = { status: action };
                if (action === 'check_in') updates.check_in_time = new Date().toISOString();
                else updates.check_out_time = new Date().toISOString();
                setVisitor(prev => prev ? ({ ...prev, ...updates }) : null);
            }

        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    // Logout removed - direct access mode

    return (
        <div className="container">
            <header className={styles.header}>
                <h1>Security Portal</h1>
                <form action={logout}>
                    <button type="submit" className="btn btn-danger">
                        Logout
                    </button>
                </form>
            </header>

            <div className={styles.dashboard}>
                <div className={styles.searchSection}>
                    <h2>Visitor Check-In/Out</h2>
                    <form onSubmit={handleSearch} className={styles.searchForm}>
                        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                            <input
                                type="text"
                                placeholder="Enter Visitor UID or Scan"
                                className="form-input"
                                value={uidInput}
                                onChange={(e) => setUidInput(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button type="button" className="btn btn-outline" onClick={() => setIsScanning(!isScanning)} title="Toggle Camera Scanner">
                                <QrCodeIcon style={{ width: 20, height: 20 }} />
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? "..." : <MagnifyingGlassIcon style={{ width: 20, height: 20 }} />}
                            </button>
                        </div>
                    </form>

                    {isScanning && (
                        <div id="reader" style={{ marginTop: '1rem', width: '100%' }}></div>
                    )}

                    {message && (
                        <div className={`${styles.message} ${message.type === 'error' ? styles.error : styles.success}`}>
                            {message.text}
                        </div>
                    )}
                </div>

                {visitor && (
                    <div className={styles.visitorCard}>
                        <div className={styles.photoWrapper}>
                            <img src={visitor.photo_url || "/placeholder-user.png"} alt={visitor.name} className={styles.photo} />
                            <div className={`badge ${visitor.status === 'checked_in' ? styles.badgeActive : styles.badgeInactive}`}>
                                {visitor.status.toUpperCase().replace('_', ' ')}
                            </div>
                        </div>

                        <div className={styles.info}>
                            <h3>{visitor.name}</h3>
                            <p><strong>UID:</strong> {visitor.visitor_uid}</p>
                            <p><strong>Visiting:</strong> {visitor.department}</p>
                            <p><strong>Purpose:</strong> {visitor.purpose}</p>

                            <div className={styles.actionSection} style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                <div className={styles.actions}>
                                    {visitor.status === 'approved' && (
                                        <div style={{ width: '100%' }}>
                                            <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>Verify details above before checking in.</p>
                                            <button onClick={() => handleAction('check_in')} className="btn btn-primary" disabled={loading} style={{ width: '100%', fontSize: '1.1rem' }}>
                                                <CheckCircleIcon style={{ width: 24, height: 24 }} /> Verify & Check In
                                            </button>
                                        </div>
                                    )}
                                    {visitor.status === 'checked_in' && (
                                        <button onClick={() => handleAction('check_out')} className="btn btn-secondary" style={{ backgroundColor: '#dc3545', width: '100%', fontSize: '1.1rem' }} disabled={loading}>
                                            <ArrowRightOnRectangleIcon style={{ width: 24, height: 24 }} /> Check Out
                                        </button>
                                    )}
                                    {visitor.status === 'checked_out' && (
                                        <div className={styles.completedState} style={{ textAlign: 'center', color: 'green' }}>
                                            <CheckCircleIcon style={{ width: 48, height: 48, margin: '0 auto', color: 'green' }} />
                                            <h3>Visit Completed</h3>
                                            <p>Time recorded.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
