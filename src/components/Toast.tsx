"use client";

import { useState, useEffect, createContext, useContext, ReactNode, useCallback, memo } from "react";
import styles from "./Toast.module.css";

interface Toast {
    id: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
}

interface ToastContextType {
    showToast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: Toast["type"] = "info") => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className={styles.toastContainer}>
                {toasts.map((toast) => (
                    <MemoizedToastItem
                        key={toast.id}
                        toast={toast}
                        onRemove={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

const ToastItem = memo(function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
        }, 4000);

        const removeTimer = setTimeout(() => {
            onRemove();
        }, 4500);

        return () => {
            clearTimeout(timer);
            clearTimeout(removeTimer);
        };
    }, [onRemove]);

    const typeStyles: Record<Toast["type"], string> = {
        success: styles.toastSuccess,
        error: styles.toastError,
        info: styles.toastInfo,
        warning: styles.toastWarning,
    };

    const icons: Record<Toast["type"], string> = {
        success: "✓",
        error: "✕",
        info: "ℹ",
        warning: "⚠",
    };

    return (
        <div
            className={`${styles.toast} ${typeStyles[toast.type]} ${isExiting ? styles.toastExit : ""}`}
            onClick={() => {
                setIsExiting(true);
                setTimeout(onRemove, 300);
            }}
        >
            <span className={styles.toastIcon}>{icons[toast.type]}</span>
            <span className={styles.toastMessage}>{toast.message}</span>
        </div>
    );
});

const MemoizedToastItem = ToastItem;
