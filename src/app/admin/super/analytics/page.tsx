"use client";

import { useState, useEffect, useMemo } from "react";
import { getVisitorLogs } from "@/app/actions/analytics";
import styles from "../page.module.css"; // Reuse super admin styles

export default function AnalyticsDashboard() {
    const [logs, setLogs] = useState<any[]>([]);
    // removed explicit filteredLogs state to use useMemo
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Filters
    const [deptFilter, setDeptFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const DEPARTMENTS = [
        "CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "EIE", "ADMINISTRATION", "LIBRARY", "HOSTEL"
    ];

    useEffect(() => {
        const fetchLogs = async () => {
            const result = await getVisitorLogs();
            if (result.success) {
                setLogs(result.logs || []);
                // filteredLogs is now derived
            } else {
                setError(result.error || "Failed to load analytics");
            }
            setLoading(false);
        };
        fetchLogs();
    }, []);

    const filteredLogs = useMemo(() => {
        const now = Date.now();

        return logs.reduce((acc, log) => {
            // Filter Logic
            if (deptFilter !== "all" && log.department !== deptFilter) return acc;
            if (statusFilter !== "all" && log.status !== statusFilter) return acc;

            // Map/Format Logic
            let duration = '-';
            if (log.check_in_time) {
                const start = new Date(log.check_in_time).getTime();
                let end = now;
                let prefix = "Active: ";

                if (log.check_out_time) {
                    end = new Date(log.check_out_time).getTime();
                    prefix = "";
                } else if (log.status !== 'checked_in') {
                    prefix = ""; // reset
                }

                if (log.status === 'checked_in' || log.check_out_time) {
                    const diff = end - start;
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    duration = `${prefix}${hours}h ${minutes}m`;
                }
            }

            acc.push({ ...log, formattedDuration: duration });
            return acc;
        }, [] as any[]);

    }, [logs, deptFilter, statusFilter]);

    return (
        <div className="container">
            <header className={styles.header}>
                <h1>Analytics & Logs</h1>
                <a href="/admin/super" className="btn btn-outline" style={{ fontSize: '0.9rem' }}>Back to Dashboard</a>
            </header>

            <div className={styles.grid} style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}> {/* Full width */}
                <div className={styles.logsSection} style={{ marginTop: 0 }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <select
                            className="form-select"
                            style={{ width: 'auto' }}
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                        >
                            <option value="all">All Departments</option>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>

                        <select
                            className="form-select"
                            style={{ width: 'auto' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="checked_in">Checked In</option>
                            <option value="checked_out">Checked Out</option>
                        </select>

                        <div style={{ marginLeft: 'auto', alignSelf: 'center', fontWeight: 'bold' }}>
                            Total: {filteredLogs.length}
                        </div>
                    </div>

                    {loading ? (
                        <p>Loading analytics...</p>
                    ) : error ? (
                        <p className={styles.error}>{error}</p>
                    ) : filteredLogs.length === 0 ? (
                        <p className={styles.placeholder}>No records found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-color)', background: '#f9f9f9' }}>
                                        <th style={{ padding: '0.75rem' }}>Date</th>
                                        <th style={{ padding: '0.75rem' }}>Visitor</th>
                                        <th style={{ padding: '0.75rem' }}>Department</th>
                                        <th style={{ padding: '0.75rem' }}>Purpose</th>
                                        <th style={{ padding: '0.75rem' }}>Status</th>
                                        <th style={{ padding: '0.75rem' }}>Duration</th>
                                        <th style={{ padding: '0.75rem' }}>Timings</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map((log: any) => {
                                        return (
                                            <tr key={log.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                <td style={{ padding: '0.75rem' }}>
                                                    {new Date(log.created_at).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <strong>{log.name}</strong><br />
                                                    <span style={{ fontSize: '0.8em', color: '#666' }}>{log.visitor_uid || '-'}</span>
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>{log.department}</td>
                                                <td style={{ padding: '0.75rem' }}>{log.purpose}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span className={`badge ${log.status === 'approved' ? 'badge-success' :
                                                        log.status === 'checked_in' ? 'badge-warning' :
                                                            'badge-neutral'
                                                        }`}>
                                                        {log.status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>
                                                    {log.formattedDuration}
                                                </td>
                                                <td style={{ padding: '0.75rem', fontSize: '0.85em', color: '#666' }}>
                                                    In: {log.check_in_time ? new Date(log.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}<br />
                                                    Out: {log.check_out_time ? new Date(log.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
