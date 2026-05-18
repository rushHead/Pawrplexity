import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import axios from 'axios';
import { BACKEND_URL } from '../lib/config';

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

const quickFilters = [
    { label: "Research", dot: "#c0c1ff" },
    { label: "Analysis", dot: "#ffb783" },
    { label: "General", dot: "#908fa0" },
    { label: "Technical", dot: "#ff4d4f" },
];

export default function History() {
    const { session } = useOutletContext<any>();
    const [conversations, setConversations] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchConvos() {
            if (!session?.access_token) return;
            const res = await axios.get(`${BACKEND_URL}/conversations`, {
                headers: { Authorization: session.access_token }
            });
            setConversations(res.data);
        }
        fetchConvos();
    }, [session]);

    const filtered = conversations.filter(c =>
        (c.title || c.slug || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar"
             style={{ background: 'var(--color-md-surface)' }}>
            <div className="flex-1 p-6 md:p-8" style={{ background: '#13131b' }}>

                {/* Page header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight"
                            style={{ color: 'var(--color-md-on-surface)', fontFamily: 'Inter, sans-serif' }}>
                            History
                        </h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--color-md-on-surface-variant)', fontFamily: 'Inter, sans-serif' }}>
                            Review and manage your past AI queries.
                        </p>
                    </div>

                    {/* Search + filter */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <MIcon className="absolute left-2 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                                   style={{ color: 'var(--color-md-on-surface-variant)' } as any}>
                                search
                            </MIcon>
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search history..."
                                className="h-8 pl-8 pr-3 rounded-md border outline-none text-sm transition-colors w-56"
                                style={{
                                    background: 'var(--color-md-surface-container-low)',
                                    borderColor: 'var(--color-md-outline-variant)',
                                    color: 'var(--color-md-on-surface)',
                                    fontFamily: 'JetBrains Mono, monospace',
                                }}
                            />
                        </div>
                        <button className="h-8 px-3 rounded-md border flex items-center justify-center transition-colors hover:opacity-80"
                                style={{ background: 'var(--color-md-surface-container-low)', borderColor: 'var(--color-md-outline-variant)', color: 'var(--color-md-on-surface-variant)' }}>
                            <MIcon className="text-sm">filter_list</MIcon>
                        </button>
                    </div>
                </div>

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* Conversation table */}
                    <div className="lg:col-span-3 rounded-lg border overflow-hidden flex flex-col shadow-sm"
                         style={{ background: 'var(--color-md-surface-container)', borderColor: 'var(--color-md-outline-variant)', minHeight: '400px' }}>

                        {/* Table header */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b text-xs uppercase tracking-wider sticky top-0 z-10"
                             style={{ borderColor: 'var(--color-md-outline-variant)', background: 'var(--color-md-surface-container-low)', color: 'var(--color-md-on-surface-variant)', fontFamily: 'JetBrains Mono, monospace' }}>
                            <div className="col-span-8 md:col-span-9">Query</div>
                            <div className="col-span-4 md:col-span-3 text-right">Action</div>
                        </div>

                        {/* Rows */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
                            {filtered.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 gap-3"
                                     style={{ color: 'var(--color-md-on-surface-variant)' }}>
                                    <MIcon className="text-4xl">history</MIcon>
                                    <p className="text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                                        {search ? "No results found." : "No history yet."}
                                    </p>
                                </div>
                            )}

                            {filtered.map(c => (
                                <div
                                    key={c.id}
                                    className="grid grid-cols-12 gap-4 px-3 py-3 items-center rounded-md border border-transparent transition-all duration-150 cursor-pointer group"
                                    style={{ ['--hover-bg' as any]: 'var(--color-md-surface-container-highest)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-md-surface-container-highest)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    onClick={() => navigate(`/chat/${c.id}`)}
                                >
                                    <div className="col-span-8 md:col-span-9 flex items-center gap-3 overflow-hidden">
                                        <MIcon className="text-lg shrink-0" style={{ color: 'var(--color-md-on-surface-variant)' } as any}>
                                            chat_bubble
                                        </MIcon>
                                        <span className="text-sm truncate transition-colors"
                                              style={{ color: 'var(--color-md-on-surface)', fontFamily: 'Inter, sans-serif' }}>
                                            {c.title || c.slug}
                                        </span>
                                    </div>
                                    <div className="col-span-4 md:col-span-3 flex justify-end">
                                        <button
                                            onClick={e => { e.stopPropagation(); navigate(`/chat/${c.id}`); }}
                                            className="px-3 py-1 rounded-sm border text-xs transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            style={{
                                                borderColor: 'var(--color-md-outline-variant)',
                                                color: 'var(--color-md-on-surface-variant)',
                                                fontFamily: 'JetBrains Mono, monospace',
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.borderColor = 'var(--color-md-primary)';
                                                e.currentTarget.style.color = 'var(--color-md-primary)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.borderColor = 'var(--color-md-outline-variant)';
                                                e.currentTarget.style.color = 'var(--color-md-on-surface-variant)';
                                            }}
                                            type="button"
                                        >
                                            View
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right sidebar panels */}
                    <div className="lg:col-span-1 flex flex-col gap-4">

                        {/* Usage stats */}
                        <div className="rounded-lg border p-4 flex flex-col gap-4"
                             style={{ background: 'var(--color-md-surface-container-low)', borderColor: 'var(--color-md-outline-variant)' }}>
                            <h3 className="text-xs uppercase tracking-wider pb-2 border-b"
                                style={{ color: 'var(--color-md-on-surface-variant)', borderColor: 'var(--color-md-outline-variant)', fontFamily: 'JetBrains Mono, monospace' }}>
                                Usage Stats
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-3xl font-semibold" style={{ color: 'var(--color-md-primary)', fontFamily: 'Inter, sans-serif' }}>
                                        {conversations.length}
                                    </div>
                                    <div className="text-xs mt-1" style={{ color: 'var(--color-md-on-surface-variant)', fontFamily: 'JetBrains Mono, monospace' }}>
                                        Total queries
                                    </div>
                                </div>
                                <div>
                                    <div className="text-3xl font-semibold" style={{ color: '#ffb783', fontFamily: 'Inter, sans-serif' }}>
                                        {filtered.length}
                                    </div>
                                    <div className="text-xs mt-1" style={{ color: 'var(--color-md-on-surface-variant)', fontFamily: 'JetBrains Mono, monospace' }}>
                                        Shown
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick filters */}
                        <div className="rounded-lg border p-4 flex flex-col gap-3 flex-1"
                             style={{ background: 'var(--color-md-surface-container-low)', borderColor: 'var(--color-md-outline-variant)' }}>
                            <h3 className="text-xs uppercase tracking-wider pb-2 border-b"
                                style={{ color: 'var(--color-md-on-surface-variant)', borderColor: 'var(--color-md-outline-variant)', fontFamily: 'JetBrains Mono, monospace' }}>
                                Quick Filters
                            </h3>
                            <div className="flex flex-col gap-1">
                                {quickFilters.map(f => (
                                    <button
                                        key={f.label}
                                        onClick={() => setSearch(f.label)}
                                        className="flex items-center justify-between p-2 rounded-md transition-colors text-left"
                                        style={{ fontFamily: 'Inter, sans-serif' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-md-surface-container-high)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        type="button"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full" style={{ background: f.dot }} />
                                            <span className="text-sm" style={{ color: 'var(--color-md-on-surface)' }}>{f.label}</span>
                                        </div>
                                        <span className="text-xs" style={{ color: 'var(--color-md-on-surface-variant)', fontFamily: 'JetBrains Mono, monospace' }}>
                                            {conversations.filter(c => (c.title || c.slug || "").toLowerCase().includes(f.label.toLowerCase())).length}
                                        </span>
                                    </button>
                                ))}
                                {search && (
                                    <button
                                        onClick={() => setSearch("")}
                                        className="flex items-center gap-2 p-2 rounded-md text-sm mt-1 transition-colors"
                                        style={{ color: 'var(--color-md-primary)', fontFamily: 'Inter, sans-serif' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-md-surface-container-high)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        type="button"
                                    >
                                        <MIcon className="text-sm">close</MIcon>
                                        Clear filter
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
