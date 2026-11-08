"use client";

import { useEffect } from "react";
import { CacheProvider } from "@chakra-ui/next-js";
import {
    ChakraProvider,
    ColorModeScript,
    useColorMode,
} from "@chakra-ui/react";
import { Toaster, resolveValue } from "react-hot-toast";
import { AuthProvider } from "@/hooks/useAuth";

const ForceLightMode = () => {
    const { colorMode, setColorMode } = useColorMode();
    useEffect(() => {
        if (colorMode !== "light") setColorMode("light");
    }, [colorMode, setColorMode]);
    return null;
};

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <CacheProvider>
            <ColorModeScript
                initialColorMode="light"
                key="chakra-ui-no-flash"
                storageKey="chakra-ui-color-mode"
            />
            <ChakraProvider>
                <ForceLightMode />
                <AuthProvider>{children}</AuthProvider>
            </ChakraProvider>
            <Toaster
                containerStyle={{
                    bottom: 40,
                    left: 20,
                    right: 20,
                }}
                position="bottom-center"
                gutter={10}
                toastOptions={{
                    duration: 3000,
                }}
            >
                {(t) => (
                    <div
                        style={{
                            opacity: t.visible ? 1 : 0,
                            transform: t.visible
                                ? "translatey(0)"
                                : "translatey(0.75rem)",
                            transition: "all .2s",
                        }}
                    >
                        {resolveValue(t.message, t)}
                    </div>
                )}
            </Toaster>
        </CacheProvider>
    );
}
