import { createClient } from '../lib/client';
import type { User, Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router";
import Sidebar from '../components/Sidebar.tsx';

const supabase = createClient();

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function getInfo() {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                setSession(session);
            } else {
                navigate("/auth");
            }
            setLoading(false);
        }
        getInfo();
    }, [navigate]);

    if (loading) return <div className="min-h-screen bg-neutral-950 text-neutral-50 flex items-center justify-center font-mono">Loading...</div>;
    if (!user) return null;

    return (
        <div className="h-screen bg-neutral-950 text-neutral-50 flex font-sans overflow-hidden">
            <Sidebar user={user} session={session} />
            <main className="flex-1 flex flex-col min-w-0 border-l border-neutral-800 bg-neutral-950 overflow-hidden relative">
                <Outlet context={{ user, session }} />
            </main>
        </div>
    );
}