"use client";

import { useEffect } from "react";

const ServiceWorker = () => {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").catch(() => null);
        }
    }, []);

    return null;
};

export default ServiceWorker;
