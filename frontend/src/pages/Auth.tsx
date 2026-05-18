import { useState } from 'react';
import { createClient } from '../lib/client';

const supabase = createClient();

function MIcon({ children, className = "", filled = false }: { children: string; className?: string; filled?: boolean }) {
    return (
        <span
            className={`material-symbols-outlined select-none ${className}`}
            style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
            {children}
        </span>
    );
}

export default function Auth() {
    const [email, setEmail] = useState("");
    const [emailSent, setEmailSent] = useState(false);
    const [loading, setLoading] = useState(false);

    async function loginOAuth(provider: "github" | "google") {
        await supabase.auth.signInWithOAuth({ provider });
    }

    async function loginEmail(e: React.FormEvent) {
        e.preventDefault();
        if (!email.trim()) return;
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({ email });
        setLoading(false);
        if (!error) setEmailSent(true);
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 antialiased"
             style={{ background: '#13131b', fontFamily: 'Inter, sans-serif' }}>

            <main className="w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col"
                  style={{ background: 'var(--color-md-surface-container-low)', border: '1px solid color-mix(in srgb, var(--color-md-outline-variant) 30%, transparent)' }}>

                {/* Header */}
                <div className="px-8 pt-10 pb-6 text-center border-b"
                     style={{ borderColor: 'color-mix(in srgb, var(--color-md-outline-variant) 20%, transparent)', background: 'color-mix(in srgb, var(--color-md-surface-container-lowest) 50%, transparent)' }}>
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-xl border flex items-center justify-center"
                             style={{ background: 'var(--color-md-surface-container-highest)', borderColor: 'var(--color-md-outline-variant)' }}>
                            <MIcon className="text-[22px]" filled style={{ color: 'var(--color-md-primary)' } as any}>pets</MIcon>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight mb-1"
                        style={{ color: 'var(--color-md-primary)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.015em' }}>
                        PAWRPLEXITY
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-md-on-surface-variant)' }}>
                        Access your AI Search Engine
                    </p>
                </div>

                {/* Body */}
                <div className="p-8 flex flex-col gap-4">

                    {/* Google */}
                    <button
                        onClick={() => loginOAuth("google")}
                        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-md border transition-colors text-sm font-medium cursor-pointer"
                        style={{
                            background: 'var(--color-md-surface)',
                            borderColor: 'var(--color-md-outline-variant)',
                            color: 'var(--color-md-on-surface)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-md-surface-container-high)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--color-md-surface)'}
                        type="button"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Continue with Google
                    </button>

                    {/* GitHub */}
                    <button
                        onClick={() => loginOAuth("github")}
                        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-md border transition-colors text-sm font-medium cursor-pointer"
                        style={{
                            background: 'var(--color-md-surface)',
                            borderColor: 'var(--color-md-outline-variant)',
                            color: 'var(--color-md-on-surface)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-md-surface-container-high)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--color-md-surface)'}
                        type="button"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" style={{ fill: 'var(--color-md-on-surface)' }}>
                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                        </svg>
                        Continue with GitHub
                    </button>

                    {/* Divider */}
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t" style={{ borderColor: 'var(--color-md-outline-variant)' }} />
                        <span className="flex-shrink-0 mx-4 text-xs uppercase tracking-widest"
                              style={{ color: 'var(--color-md-on-surface-variant)', fontFamily: 'JetBrains Mono, monospace' }}>
                            or
                        </span>
                        <div className="flex-grow border-t" style={{ borderColor: 'var(--color-md-outline-variant)' }} />
                    </div>

                    {/* Email form */}
                    {emailSent ? (
                        <div className="flex flex-col items-center gap-3 py-4 text-center">
                            <MIcon className="text-3xl" filled style={{ color: 'var(--color-md-primary)' } as any}>mark_email_read</MIcon>
                            <p className="text-sm font-medium" style={{ color: 'var(--color-md-on-surface)' }}>Check your inbox</p>
                            <p className="text-xs" style={{ color: 'var(--color-md-on-surface-variant)' }}>
                                We sent a magic link to <strong>{email}</strong>
                            </p>
                            <button onClick={() => setEmailSent(false)} className="text-xs underline mt-1 cursor-pointer"
                                    style={{ color: 'var(--color-md-primary)' }}>
                                Use a different email
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={loginEmail} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="email" className="text-xs"
                                       style={{ color: 'var(--color-md-on-surface-variant)', fontFamily: 'JetBrains Mono, monospace' }}>
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    className="h-9 rounded-md border px-3 text-sm outline-none transition-all"
                                    style={{
                                        background: 'var(--color-md-surface)',
                                        borderColor: 'var(--color-md-outline-variant)',
                                        color: 'var(--color-md-on-surface)',
                                        fontFamily: 'Inter, sans-serif',
                                    }}
                                    onFocus={e => e.currentTarget.style.borderColor = 'var(--color-md-primary)'}
                                    onBlur={e => e.currentTarget.style.borderColor = 'var(--color-md-outline-variant)'}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="h-10 mt-1 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
                                style={{ background: 'var(--color-md-primary)', color: 'var(--color-md-on-primary)', fontFamily: 'Inter, sans-serif' }}
                                onMouseEnter={e => !loading && (e.currentTarget.style.background = 'var(--color-md-primary-container)')}
                                onMouseLeave={e => e.currentTarget.style.background = 'var(--color-md-primary)'}
                            >
                                {loading ? "Sending..." : "Continue with Email"}
                                {!loading && <MIcon className="text-[18px]">arrow_forward</MIcon>}
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 text-center border-t"
                     style={{ background: 'var(--color-md-surface-container-lowest)', borderColor: 'color-mix(in srgb, var(--color-md-outline-variant) 20%, transparent)' }}>
                    <p className="text-xs" style={{ color: 'var(--color-md-on-surface-variant)', fontFamily: 'JetBrains Mono, monospace' }}>
                        By continuing, you agree to our{" "}
                        <a className="hover:underline cursor-pointer" style={{ color: 'var(--color-md-primary)' }} href="#">Terms of Service</a>
                        {" "}and{" "}
                        <a className="hover:underline cursor-pointer" style={{ color: 'var(--color-md-primary)' }} href="#">Privacy Policy</a>.
                    </p>
                </div>
            </main>
        </div>
    );
}
