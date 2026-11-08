"use client";

import { useSearchParams } from "next/navigation";
import Layout from "@/components/Layout";

import { chats } from "@/constants/navigation";

const HomePage = () => {
    const searchParams = useSearchParams();
    const activeChat =
        chats.find((chat) => chat.id === searchParams.get("chat")) ??
        chats[0];

    return (
        <Layout>
            <div className="flex flex-col grow w-full h-full">
                {activeChat.url ? (
                    <iframe
                        src={activeChat.url}
                        title={activeChat.title}
                        className="grow w-full h-full border-0"
                    />
                ) : (
                    <div className="flex flex-col grow items-center justify-center gap-3 text-n-4">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: activeChat.color }}
                        />
                        <div className="text-base-2">escolha uma bolinha</div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default HomePage;
