"use client";
import { usePolling } from "@/hooks/usePolling";

export function PollingRefresher() {
    usePolling(5000);
    return null;
}