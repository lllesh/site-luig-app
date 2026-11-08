import Link from "next/link";
import Icon from "@/components/Icon";
import Profile from "./Profile";

type HeaderProps = {
    sidebarDark: boolean;
    onToggleSidebarDark: () => void;
};

const Header = ({ sidebarDark, onToggleSidebarDark }: HeaderProps) => {
    return (
        <div
            className="absolute top-0 left-0 right-0 z-10 md:fixed md:z-30"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
            <div className="flex items-center justify-end gap-3 h-16 px-4 md:pl-20">
                <Link
                    className="flex items-center justify-center w-9 h-9"
                    href="/chatbot/create"
                >
                    <Icon
                        className="w-6 h-6 fill-[#e4c1a7]"
                        name="add-circle"
                    />
                </Link>
                <button
                    className="flex items-center justify-center w-9 h-9"
                    onClick={onToggleSidebarDark}
                >
                    <Icon
                        className="w-6 h-6 fill-[#e4c1a7]"
                        name={sidebarDark ? "sun" : "moon"}
                    />
                </button>
                <Profile />
            </div>
        </div>
    );
};

export default Header;
