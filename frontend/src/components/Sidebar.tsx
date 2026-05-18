import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import axios from 'axios';
import { BACKEND_URL } from '../lib/config';
import { createClient } from '../lib/client';

const supabase = createClient();

function MIcon({ children, filled = false, className = "" }: { children: string; filled?: boolean; className?: string }) {
    return (
        <span
            className={`material-symbols-outlined select-none ${className}`}
            style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
            {children}
        </span>
    );
}

export default function Sidebar({ user, session }: { user: any; session: any }) {
    const [conversations, setConversations] = useState<any[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchConvos() {
            if (!session?.access_token) return;
            try {
                const res = await axios.get(`${BACKEND_URL}/conversations`, {
                    headers: { Authorization: session.access_token }
                });
                setConversations(res.data);
            } catch {
                console.error("Failed to fetch conversations");
            }
        }
        fetchConvos();
    }, [session]);

    const navLinkClass = (isActive: boolean) =>
        `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors duration-150 text-sm ${
            isActive
                ? 'font-semibold'
                : 'hover:opacity-80'
        }`;

    return (
        <div className="w-64 h-screen flex flex-col shrink-0 flex-col fixed left-0 top-0 z-20"
             style={{ background: 'var(--color-md-surface-container)', borderRight: '1px solid var(--color-md-outline-variant)' }}>

            {/* Brand */}
            <div className="px-4 pt-5 pb-4 flex flex-col gap-4">
                <div className="flex items-center gap-3 px-2">
                    <MIcon filled className="text-[22px]" style={{ color: 'var(--color-md-primary)' } as any}>pets</MIcon>
                    <div>
                        <h1 className="font-bold tracking-tight leading-none text-base"
                            style={{ color: 'var(--color-md-on-surface)', fontFamily: 'Inter, sans-serif' }}>
                            Pawrplexity
                        </h1>
                        <span className="text-[10px]" style={{ color: 'var(--color-md-on-surface-variant)', fontFamily: 'JetBrains Mono, monospace' }}>
                            AI Search Engine
                        </span>
                    </div>
                </div>

                {/* New Query button */}
                <button
                    onClick={() => navigate("/")}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-full text-sm font-medium transition-colors duration-150 cursor-pointer hover:opacity-90"
                    style={{ background: 'var(--color-md-primary)', color: 'var(--color-md-on-primary)', fontFamily: 'Inter, sans-serif' }}
                    type="button"
                >
                    <MIcon className="text-[18px]">add</MIcon>
                    New Query
                </button>
            </div>

            {/* Main nav + recents */}
            <div className="flex-1 overflow-y-auto px-3 flex flex-col gap-1 pb-2">
                {/* Nav links */}
                <div className="mb-4 flex flex-col gap-0.5">
                    {[
                        { label: "Discover", icon: "explore", to: "/" },
                        { label: "History", icon: "history", to: "/history" },
                        { label: "Tools", icon: "build", to: "/tools" },
                    ].map(item => (
                        <NavLink
                            key={item.label}
                            to={item.to}
                            end={item.to === "/"}
                            className={({ isActive }) => navLinkClass(isActive)}
                            style={({ isActive }) => ({
                                color: isActive ? 'var(--color-md-primary)' : 'var(--color-md-on-surface-variant)',
                                background: isActive ? 'color-mix(in srgb, var(--color-md-secondary-container) 20%, transparent)' : 'transparent',
                                fontFamily: 'Inter, sans-serif',
                            })}
                        >
                            <MIcon className="text-[20px]">{item.icon}</MIcon>
                            {item.label}
                        </NavLink>
                    ))}
                </div>

                {/* Recent conversations */}
                {conversations.length > 0 && (
                    <div className="flex flex-col gap-1">
                        <h3 className="px-3 text-[10px] uppercase tracking-wider mb-1"
                            style={{ color: 'var(--color-md-outline)', fontFamily: 'JetBrains Mono, monospace' }}>
                            Recent
                        </h3>
                        {conversations.slice(0, 10).map(c => (
                            <NavLink
                                key={c.id}
                                to={`/chat/${c.id}`}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-1.5 rounded-xl transition-colors duration-150 text-sm ${isActive ? '' : 'hover:opacity-80'}`
                                }
                                style={({ isActive }) => ({
                                    color: isActive ? 'var(--color-md-on-surface)' : 'var(--color-md-on-surface-variant)',
                                    background: isActive ? 'var(--color-md-surface-container-high)' : 'transparent',
                                    fontFamily: 'Inter, sans-serif',
                                })}
                            >
                                <MIcon className="text-[16px]" style={{ color: 'var(--color-md-outline)' } as any}>chat_bubble</MIcon>
                                <span className="truncate">{c.title || c.slug}</span>
                            </NavLink>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-3 pt-3 pb-4 flex flex-col gap-1"
                 style={{ borderTop: '1px solid color-mix(in srgb, var(--color-md-outline-variant) 30%, transparent)' }}>

                {/* Settings */}
                <NavLink
                    to="/tools"
                    className={({ isActive }) => navLinkClass(isActive)}
                    style={({ isActive }) => ({
                        color: isActive ? 'var(--color-md-primary)' : 'var(--color-md-on-surface-variant)',
                        fontFamily: 'Inter, sans-serif',
                    })}
                >
                    <MIcon className="text-[20px]">settings</MIcon>
                    Settings
                </NavLink>

                {/* User row */}
                <button
                    className="flex items-center gap-3 px-3 py-2 rounded-xl w-full text-left transition-colors duration-150 cursor-pointer mt-1 hover:opacity-80"
                    style={{ color: 'var(--color-md-on-surface-variant)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-md-surface-container-high)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => supabase.auth.signOut()}
                    type="button"
                    title="Sign out"
                >
                    {/* Avatar circle with initial */}
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                         style={{ background: 'var(--color-md-primary-container)', color: 'var(--color-md-on-primary)' }}>
                        {user?.email?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <span className="text-sm truncate flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {user?.email ?? "User"}
                    </span>
                    <MIcon className="text-[18px] shrink-0">logout</MIcon>
                </button>
            </div>
        </div>
    );
}
