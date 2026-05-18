import { useOutletContext } from 'react-router';

export default function Tools() {
    const { user } = useOutletContext<any>();

    return (
        <div className="flex-1 flex flex-col h-full overflow-y-auto p-8 font-mono">
            <h1 className="text-2xl font-bold border-b border-neutral-800 pb-4 mb-8 uppercase tracking-tighter">System Tools & Preferences</h1>
            <div className="border border-neutral-800 p-6 max-w-2xl bg-neutral-900/50">
                <h2 className="text-lg font-bold mb-4 border-b border-neutral-800 pb-2">Account Profile</h2>
                <div className="grid grid-cols-[120px_1fr] gap-4 text-sm mb-4">
                    <span className="text-neutral-500">ID:</span>
                    <span className="text-neutral-200">{user.id}</span>
                    <span className="text-neutral-500">Email:</span>
                    <span className="text-neutral-200">{user.email}</span>
                    <span className="text-neutral-500">Provider:</span>
                    <span className="text-neutral-200 uppercase">{user.app_metadata.provider}</span>
                </div>
            </div>
        </div>
    );
}
