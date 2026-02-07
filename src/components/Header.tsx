"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import styles from "./Header.module.css";
import {
    HomeIcon,
    UserGroupIcon,
    ShieldCheckIcon,
    IdentificationIcon,
    SunIcon,
    MoonIcon
} from "@heroicons/react/24/outline";

export default function Header() {
    const pathname = usePathname();
    const [isDark, setIsDark] = useState(false);

    // Initialize theme from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    // Toggle theme
    const toggleTheme = () => {
        setIsDark(!isDark);
        if (!isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const isActive = (path: string) => pathname === path;

    // Show minimal header on /register (logo + theme toggle only)
    if (pathname === '/register') {
        return (
            <header className={styles.header}>
                <div className={styles.container}>
                    <div className={styles.logoSection}>
                        <img
                            src="/logo.png"
                            alt="SCSVMV Logo"
                            className={styles.logo}
                            draggable="false"
                        />
                    </div>

                    <button
                        onClick={toggleTheme}
                        className={styles.themeToggle}
                        aria-label="Toggle dark mode"
                    >
                        {isDark ? (
                            <SunIcon className={styles.themeIcon} />
                        ) : (
                            <MoonIcon className={styles.themeIcon} />
                        )}
                    </button>
                </div>
            </header>
        );
    }

    // Show minimal header on admin routes (logo + Admin link + theme toggle only)
    if (pathname.startsWith('/admin') || pathname === '/security' || pathname === '/login') {
        return (
            <header className={styles.header}>
                <div className={styles.container}>
                    <div className={styles.logoSection}>
                        <img
                            src="/logo.png"
                            alt="SCSVMV Logo"
                            className={styles.logo}
                            draggable="false"
                        />
                    </div>

                    <div className={styles.rightSection}>
                        <nav className={styles.nav}>
                            <Link
                                href="/login"
                                className={`${styles.navLink} ${isActive('/login') || pathname.startsWith('/admin') ? styles.active : ''}`}
                            >
                                <UserGroupIcon className={styles.icon} />
                                <span>Admin/Staff</span>
                            </Link>
                        </nav>

                        <button
                            onClick={toggleTheme}
                            className={styles.themeToggle}
                            aria-label="Toggle dark mode"
                        >
                            {isDark ? (
                                <SunIcon className={styles.themeIcon} />
                            ) : (
                                <MoonIcon className={styles.themeIcon} />
                            )}
                        </button>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <div className={styles.logoSection}>
                    <img
                        src="/logo.png"
                        alt="SCSVMV Logo"
                        className={styles.logo}
                        draggable="false"
                    />
                </div>

                <div className={styles.rightSection}>
                    <nav className={styles.nav}>
                        <Link
                            href="/"
                            className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`}
                        >
                            <HomeIcon className={styles.icon} />
                            <span>Home</span>
                        </Link>

                        <Link
                            href="/register"
                            className={`${styles.navLink} ${isActive('/register') ? styles.active : ''}`}
                        >
                            <IdentificationIcon className={styles.icon} />
                            <span>Visitor Registration</span>
                        </Link>

                        <Link
                            href="/login"
                            className={`${styles.navLink} ${isActive('/login') || pathname.startsWith('/admin') ? styles.active : ''}`}
                        >
                            <UserGroupIcon className={styles.icon} />
                            <span>Admin/Staff</span>
                        </Link>
                    </nav>

                    <button
                        onClick={toggleTheme}
                        className={styles.themeToggle}
                        aria-label="Toggle dark mode"
                    >
                        {isDark ? (
                            <SunIcon className={styles.themeIcon} />
                        ) : (
                            <MoonIcon className={styles.themeIcon} />
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}
