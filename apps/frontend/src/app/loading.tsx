import { Logo } from "@/components/icons/logo"

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-5">
            {/* Pulse ring */}
            <div className="relative flex items-center justify-center">
                <div
                    className="absolute w-16 h-16 rounded-full animate-ping"
                    style={{ background: "rgba(214,31,44,0.15)" }}
                />
                <div
                    className="absolute w-12 h-12 rounded-full animate-pulse"
                    style={{ background: "rgba(214,31,44,0.08)" }}
                />
                <Logo />
            </div>
            <p
                className="text-sm text-[#475569]"
                style={{ fontFamily: "var(--font-outfit, sans-serif)" }}
            >
                Loading protocol data...
            </p>
        </div>
    )
}
