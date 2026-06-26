import { PollingRefresher } from "@/app/componentes/PollingRefresher";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <PollingRefresher />
            {children}
        </>
    );
}