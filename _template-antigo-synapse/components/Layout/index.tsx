import { useState, useEffect, useLayoutEffect } from "react";
import LeftSidebar from "@/components/LeftSidebar";
import Header from "@/components/Header";

type LayoutProps = {
    children: React.ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
    const [visible, setVisible] = useState<boolean>(false);
    const [sidebarDark, setSidebarDark] = useState<boolean>(false);
    const [openCount, setOpenCount] = useState<number>(0);

    const toggleVisible = () => {
        setVisible((prev) => {
            const next = !prev;
            if (next) setOpenCount((c) => c + 1);
            return next;
        });
    };

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setVisible(false);
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);

    useLayoutEffect(() => {
        document.documentElement.setAttribute(
            "data-theme",
            sidebarDark ? "dark" : "light"
        );
    }, [sidebarDark]);

    return (
        <div className="pr-6 pl-20 md:p-0">
            <button
                type="button"
                onClick={toggleVisible}
                aria-label={visible ? "Fechar menu" : "Abrir menu"}
                className="fixed left-3 z-50 w-14 h-14 transition-transform duration-300 ease-out hover:scale-125 active:scale-75"
                style={{ top: "calc(0.75rem + env(safe-area-inset-top))" }}
            >
                <img
                    src="/images/apple-meuapp-transparente.png"
                    alt=""
                    className="apple-idle-float w-full h-full object-contain"
                />
            </button>
            <LeftSidebar
                visible={visible}
                openCount={openCount}
                onClick={toggleVisible}
                onClose={() => setVisible(false)}
            />
            <div className="flex py-6 min-h-[100dvh] md:py-0">
                <div className="relative flex flex-col grow max-w-full pt-16 bg-n-1 rounded-xl border-[6px] border-[#FFFBF3] shadow-[0_0_0_1px_rgba(0,0,0,0.08)] overflow-y-auto scroll-smooth scrollbar-none md:rounded-none dark:bg-n-6 dark:border-n-6">
                    <Header
                        sidebarDark={sidebarDark}
                        onToggleSidebarDark={() =>
                            setSidebarDark(!sidebarDark)
                        }
                    />
                    <div className="flex flex-col grow overflow-y-auto scroll-smooth scrollbar-none">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Layout;
