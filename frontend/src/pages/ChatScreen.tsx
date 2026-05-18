import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router';
import { BACKEND_URL } from '../lib/config';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

// Material Symbols icon component
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

function AssistantAvatar() {
    return (
        <div className="w-8 h-8 rounded-full flex-shrink-0 mt-1 flex items-center justify-center"
             style={{ background: 'var(--color-md-primary-container)' }}>
            <MIcon className="text-sm" filled style={{ color: 'var(--color-md-on-primary)' } as any}>smart_toy</MIcon>
        </div>
    );
}

export default function ChatScreen() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { session } = useOutletContext<any>();

    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (id && session?.access_token) {
            axios.get(`${BACKEND_URL}/conversations/${id}`, {
                headers: { Authorization: session.access_token }
            }).then(res => setMessages(res.data.messages || []))
              .catch(err => console.error("Failed to fetch conversation", err));
        } else if (!id) {
            setMessages([]);
            setInput("");
        }
    }, [id, session]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
        }
    }, [input]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || loading || !session?.access_token) return;

        const query = input;
        setInput("");
        setLoading(true);

        const tempMessage = { id: Date.now(), role: "User", content: query };
        const assistantPlaceholder = { id: Date.now() + 1, role: "Assistant", content: "", sources: [] };
        setMessages(prev => [...prev, tempMessage, assistantPlaceholder]);

        try {
            const endpoint = id ? `${BACKEND_URL}/pawrplexity_ask/follow_up` : `${BACKEND_URL}/pawrplexity_ask`;
            const payload = id ? { conversationId: id, query } : { query };

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": session.access_token },
                body: JSON.stringify(payload)
            });

            if (!id && response.headers.get("x-conversation-id")) {
                sessionStorage.setItem("pending_nav", response.headers.get("x-conversation-id") as string);
            }

            const reader = response.body?.getReader();
            if (!reader) return;

            const decoder = new TextDecoder();
            let fullText = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                fullText += decoder.decode(value, { stream: true });
                let displayContent = fullText;
                let sources = null;

                const sourcesIndex = fullText.indexOf("\n<SOURCES>\n");
                if (sourcesIndex !== -1) {
                    displayContent = fullText.substring(0, sourcesIndex);
                    const endIndex = fullText.indexOf("\n</SOURCES>\n");
                    if (endIndex !== -1) {
                        try { sources = JSON.parse(fullText.substring(sourcesIndex + 11, endIndex)); } catch (e) {}
                    }
                }

                setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1].content = displayContent;
                    if (sources) newMsgs[newMsgs.length - 1].sources = sources;
                    return newMsgs;
                });
            }

            const pendingNav = sessionStorage.getItem("pending_nav");
            if (pendingNav) {
                sessionStorage.removeItem("pending_nav");
                navigate(`/chat/${pendingNav}`, { replace: true });
            }
        } catch (error) {
            console.error("Chat error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Parse follow-ups from markdown content
    const parseContent = (content: string) => {
        let mainMarkdown = content;
        let followUps: string[] = [];
        const match = content.match(/\n###?\s*Follow-ups?.*?(\n|$)/i);
        if (match) {
            mainMarkdown = content.substring(0, match.index);
            const followUpsText = content.substring(match.index! + match[0].length);
            followUps = followUpsText.split('\n')
                .filter((line: string) => line.trim().startsWith('*') || line.trim().startsWith('-'))
                .map((line: string) => line.replace(/^[\*\-\s]+/, '').trim())
                .filter(Boolean);
        }
        return { mainMarkdown, followUps };
    };

    const inputBar = (
        <div className="relative z-10 pt-10 px-4 md:px-6 pb-4"
             style={{ background: 'linear-gradient(to top, #13131b 70%, transparent)' }}>
            <div className="max-w-3xl mx-auto">
                <div className="rounded-xl border flex flex-col p-2 shadow-lg transition-all duration-200 focus-within:ring-1"
                     style={{
                         background: 'var(--color-md-surface-container)',
                         borderColor: 'var(--color-md-outline-variant)',
                         '--tw-ring-color': 'var(--color-md-primary)',
                     } as any}>
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={messages.length === 0 ? "Ask anything..." : "Ask a follow-up..."}
                        rows={1}
                        className="w-full bg-transparent border-none outline-none resize-none px-3 py-2 min-h-[52px] max-h-[200px] custom-scrollbar text-base"
                        style={{ color: 'var(--color-md-on-surface)', fontFamily: 'Inter, sans-serif' }}
                    />
                    <div className="flex justify-between items-center px-2 pb-1 pt-2 mt-1"
                         style={{ borderTop: '1px solid color-mix(in srgb, var(--color-md-outline-variant) 40%, transparent)' }}>
                        <div className="flex gap-1">
                            <button className="p-2 rounded-lg transition-colors hover:opacity-80" type="button"
                                    style={{ color: 'var(--color-md-on-surface-variant)' }}
                                    title="Attach File">
                                <MIcon className="text-sm">attach_file</MIcon>
                            </button>
                            <button className="p-2 rounded-lg transition-colors hover:opacity-80" type="button"
                                    style={{ color: 'var(--color-md-on-surface-variant)' }}
                                    title="Focus Mode">
                                <MIcon className="text-sm">center_focus_strong</MIcon>
                            </button>
                        </div>
                        <button
                            onClick={() => handleSubmit()}
                            disabled={!input.trim() || loading}
                            className="p-2 rounded-lg transition-colors shadow-sm flex items-center justify-center disabled:opacity-40 cursor-pointer"
                            style={{ background: 'var(--color-md-primary)', color: 'var(--color-md-on-primary)' }}
                            type="button"
                        >
                            <MIcon className="text-sm" filled>send</MIcon>
                        </button>
                    </div>
                </div>
                <p className="text-center mt-3 text-xs" style={{ color: 'var(--color-md-on-surface-variant)' }}>
                    Pawrplexity can make mistakes. Consider verifying important information.
                </p>
            </div>
        </div>
    );

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col h-full relative overflow-hidden" style={{ background: 'var(--color-md-surface)' }}>
                {/* Background glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <div className="w-[600px] h-[600px] rounded-full blur-3xl"
                         style={{ background: 'var(--color-md-primary)' }} />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
                    <div className="w-full max-w-3xl flex flex-col items-center -mt-16">
                        {/* Icon + heading */}
                        <div className="mb-10 flex flex-col items-center gap-4">
                            <div className="h-16 w-16 rounded-2xl border flex items-center justify-center shadow-lg"
                                 style={{ background: 'var(--color-md-surface-container-highest)', borderColor: 'var(--color-md-outline-variant)' }}>
                                <MIcon className="text-[36px]" filled style={{ color: 'var(--color-md-primary)' } as any}>pets</MIcon>
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight text-center"
                                style={{ color: 'var(--color-md-on-surface)', fontFamily: 'Inter, sans-serif' }}>
                                Where knowledge begins
                            </h1>
                        </div>

                        {/* Search input */}
                        <div className="w-full relative group">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none transition-colors"
                                 style={{ color: 'var(--color-md-on-surface-variant)' }}>
                                <MIcon className="text-[24px]">search</MIcon>
                            </div>
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                placeholder="Ask anything..."
                                className="w-full h-16 pl-14 pr-20 rounded-full border outline-none transition-all shadow-sm text-base"
                                style={{
                                    background: 'var(--color-md-surface-container)',
                                    borderColor: 'var(--color-md-outline-variant)',
                                    color: 'var(--color-md-on-surface)',
                                    fontFamily: 'Inter, sans-serif',
                                }}
                                onFocus={e => {
                                    e.currentTarget.style.borderColor = 'var(--color-md-primary)';
                                    e.currentTarget.style.background = 'var(--color-md-surface-container-high)';
                                }}
                                onBlur={e => {
                                    e.currentTarget.style.borderColor = 'var(--color-md-outline-variant)';
                                    e.currentTarget.style.background = 'var(--color-md-surface-container)';
                                }}
                            />
                            <div className="absolute inset-y-0 right-2 flex items-center">
                                <button
                                    onClick={() => handleSubmit()}
                                    disabled={!input.trim() || loading}
                                    className="h-12 w-12 rounded-full border flex items-center justify-center transition-all duration-200 disabled:opacity-40 cursor-pointer"
                                    style={{
                                        background: 'var(--color-md-surface-container-highest)',
                                        borderColor: 'var(--color-md-outline-variant)',
                                        color: 'var(--color-md-on-surface-variant)',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'var(--color-md-primary-container)';
                                        e.currentTarget.style.borderColor = 'var(--color-md-primary-container)';
                                        e.currentTarget.style.color = 'var(--color-md-on-primary)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'var(--color-md-surface-container-highest)';
                                        e.currentTarget.style.borderColor = 'var(--color-md-outline-variant)';
                                        e.currentTarget.style.color = 'var(--color-md-on-surface-variant)';
                                    }}
                                    type="button"
                                >
                                    <MIcon className="text-[20px]">arrow_forward</MIcon>
                                </button>
                            </div>
                        </div>

                        {/* Suggestion chips */}
                        <div className="mt-8 w-full">
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                {[
                                    { label: "Debug Python Script", icon: "code" },
                                    { label: "Summarize Research Paper", icon: "article" },
                                    { label: "Translate Documentation", icon: "translate" },
                                    { label: "Brainstorm Ideas", icon: "lightbulb" },
                                ].map(s => (
                                    <button
                                        key={s.label}
                                        onClick={() => setInput(s.label)}
                                        className="px-4 py-2 rounded-full border text-sm flex items-center gap-2 transition-all duration-200 cursor-pointer"
                                        style={{
                                            background: 'var(--color-md-surface-container-low)',
                                            borderColor: 'var(--color-md-outline-variant)',
                                            color: 'var(--color-md-on-surface-variant)',
                                            fontFamily: 'Inter, sans-serif',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = 'var(--color-md-surface-container-high)';
                                            e.currentTarget.style.color = 'var(--color-md-on-surface)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = 'var(--color-md-surface-container-low)';
                                            e.currentTarget.style.color = 'var(--color-md-on-surface-variant)';
                                        }}
                                        type="button"
                                    >
                                        <MIcon className="text-[16px]">{s.icon}</MIcon>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="flex-1 flex flex-col h-full relative" style={{ background: 'var(--color-md-surface)' }}>
            {/* Scrollable messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pt-6 pb-4 px-4 md:px-8 flex flex-col gap-6">
                <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
                    {messages.map((m, idx) => {
                        if (m.role === 'User') {
                            return (
                                <div key={idx} className="flex justify-end w-full">
                                    <div className="p-4 rounded-xl max-w-[85%] border shadow-sm text-base"
                                         style={{
                                             background: 'var(--color-md-surface-container-high)',
                                             color: 'var(--color-md-on-surface)',
                                             borderColor: 'var(--color-md-outline-variant)',
                                             fontFamily: 'Inter, sans-serif',
                                         }}>
                                        {m.content}
                                    </div>
                                </div>
                            );
                        }

                        const { mainMarkdown, followUps } = parseContent(m.content);
                        const isStreaming = idx === messages.length - 1 && loading && m.content.length > 0;
                        const isEmpty = loading && m.content === "" && idx === messages.length - 1;

                        return (
                            <div key={idx} className="flex items-start gap-4 w-full">
                                <AssistantAvatar />
                                <div className="flex-1 flex flex-col gap-4 min-w-0 pt-1">
                                    {isEmpty ? (
                                        <div className="flex flex-col gap-3">
                                            <div className="h-4 rounded animate-pulse w-3/4"
                                                 style={{ background: 'var(--color-md-surface-container-high)' }} />
                                            <div className="h-4 rounded animate-pulse w-1/2"
                                                 style={{ background: 'var(--color-md-surface-container-high)' }} />
                                        </div>
                                    ) : (
                                        <>
                                            {/* Main answer markdown */}
                                            <div className="prose prose-invert max-w-none text-base leading-relaxed
                                                [&>p]:mb-4 [&>p]:text-[--color-md-on-surface]
                                                [&>h1]:text-2xl [&>h1]:font-semibold [&>h1]:mb-4 [&>h1]:text-[--color-md-on-surface]
                                                [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mt-6 [&>h2]:mb-3 [&>h2]:text-[--color-md-on-surface]
                                                [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mt-5 [&>h3]:mb-2 [&>h3]:text-[--color-md-on-surface]
                                                [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul]:space-y-2
                                                [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4
                                                [&>li]:text-[--color-md-on-surface-variant]
                                                [&>strong]:text-[--color-md-on-surface] [&>strong]:font-semibold
                                                [&>code]:bg-[--color-md-surface-container-high] [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>code]:font-mono
                                                [&>pre]:bg-[--color-md-surface-container-high] [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre]:mb-4"
                                                 style={{ color: 'var(--color-md-on-surface)', fontFamily: 'Inter, sans-serif' }}>
                                                <ReactMarkdown>{mainMarkdown}</ReactMarkdown>
                                            </div>

                                            {/* Sources */}
                                            {m.sources && m.sources.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {m.sources.map((s: any, i: number) => (
                                                        <a key={i} href={s.url} target="_blank" rel="noreferrer"
                                                           className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors text-sm hover:opacity-80"
                                                           style={{
                                                               background: 'var(--color-md-surface-container)',
                                                               borderColor: 'var(--color-md-outline-variant)',
                                                               color: 'var(--color-md-on-surface-variant)',
                                                           }}>
                                                            <MIcon className="text-xs" style={{ color: 'var(--color-md-primary)' } as any}>public</MIcon>
                                                            <span className="truncate max-w-[150px]">
                                                                {s.url.replace(/^https?:\/\//, '').split('/')[0]}
                                                            </span>
                                                        </a>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Follow-ups */}
                                            {followUps.length > 0 && (
                                                <div className="flex flex-col gap-2">
                                                    <p className="text-sm font-semibold mt-2" style={{ color: 'var(--color-md-on-surface-variant)' }}>
                                                        Follow-ups
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {followUps.map((fu: string, i: number) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => setInput(fu)}
                                                                className="px-4 py-2 rounded-full border text-sm flex items-center gap-2 transition-all hover:opacity-80 cursor-pointer"
                                                                style={{
                                                                    background: 'var(--color-md-surface-container-low)',
                                                                    borderColor: 'var(--color-md-outline-variant)',
                                                                    color: 'var(--color-md-on-surface)',
                                                                    fontFamily: 'Inter, sans-serif',
                                                                }}
                                                                type="button"
                                                            >
                                                                <MIcon className="text-xs" style={{ color: 'var(--color-md-primary)' } as any}>add_circle</MIcon>
                                                                {fu}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Streaming indicator */}
                                            {isStreaming && (
                                                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-md-on-surface-variant)' }}>
                                                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--color-md-primary)' }} />
                                                    Generating...
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Sticky bottom input */}
            {inputBar}
        </div>
    );
}
