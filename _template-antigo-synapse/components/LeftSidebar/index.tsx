"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { chats } from "@/constants/navigation";

type LeftSidebarProps = {
    onClick: () => void;
    onClose?: () => void;
    visible: boolean;
    openCount?: number;
};

const LeftSidebar = ({ onClick, visible, openCount = 0 }: LeftSidebarProps) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const scrollRootRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const pendingElsRef = useRef<HTMLButtonElement[]>([]);
    const activeId =
        pathname === "/" ? searchParams.get("chat") ?? "0" : null;

    const handleClick = (id: string) => {
        router.push(`/?chat=${id}`);
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.remove("opacity-0");
                        entry.target.classList.add("pill-fade-up");
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                root: scrollRootRef.current,
                threshold: 0.1,
                rootMargin: "0px 0px -5% 0px",
            }
        );
        observerRef.current = observer;
        pendingElsRef.current.forEach((el) => observer.observe(el));
        pendingElsRef.current = [];

        return () => {
            observer.disconnect();
            observerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const registerPill = (el: HTMLButtonElement | null) => {
        if (!el) return;
        if (observerRef.current) {
            observerRef.current.observe(el);
        } else {
            pendingElsRef.current.push(el);
        }
    };

    return (
        <div
            className={`fixed z-40 flex flex-col transition-all duration-300 overflow-hidden bg-n-1 dark:bg-noite ${
                visible
                    ? "inset-0 w-full h-full pt-24 pb-10 px-6 md:pt-20 md:px-4"
                    : "top-0 left-0 bottom-0 w-20 pt-30 pb-4 bg-transparent dark:bg-transparent md:top-16 md:pt-10 md:w-[19rem] md:-translate-x-full"
            }`}
        >
            <div className="relative grow overflow-hidden">
                <div
                    ref={scrollRootRef}
                    className="relative h-full max-w-none md:max-w-md mx-auto w-full px-[22px] overflow-y-auto scroll-smooth scrollbar-none [mask-image:linear-gradient(to_bottom,transparent,black_1.5rem,black_calc(100%-2.5rem),transparent)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_1.5rem,black_calc(100%-2.5rem),transparent)]"
                >
                    <div className="relative pt-6 pb-10">
                        {chats.map((chat, index) =>
                            visible ? (
                                <button
                                    key={`${chat.id}-${openCount}`}
                                    ref={registerPill}
                                    className="opacity-0 relative flex items-center justify-center w-full h-14 mb-3 px-4 rounded-full text-center transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.03] active:translate-y-0 active:scale-[0.96]"
                                    onClick={() => handleClick(chat.id)}
                                    style={{
                                        backgroundColor: chat.color,
                                        animationDelay: `${index * 30}ms`,
                                    }}
                                >
                                    <span className="text-base-2 font-semibold uppercase tracking-[0.2em] text-white dark:text-black truncate">
                                        {chat.title}
                                    </span>
                                </button>
                            ) : (
                                <button
                                    key={chat.id}
                                    ref={registerPill}
                                    className="opacity-0 relative flex items-center justify-center w-9 h-9 mb-2 rounded-full shrink-0 transition-transform duration-150 ease-out hover:scale-110 active:scale-90"
                                    onClick={() => handleClick(chat.id)}
                                    style={{
                                        backgroundColor: chat.color,
                                        animationDelay: `${index * 15}ms`,
                                    }}
                                />
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeftSidebar;
