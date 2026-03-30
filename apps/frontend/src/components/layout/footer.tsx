import Link from "next/link"
import { Logo } from "@/components/icons/logo"

export function Footer() {
    return (
        <footer className="border-t py-6 md:py-0">
            <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:h-16 md:flex-row">
                <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2">
                    <Logo />
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        The Capital Layer of Web3. Built on <span className="font-semibold text-foreground">Paxeer Network</span>.
                    </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Link href="https://x.com/Ziba_Xeer" className="hover:text-foreground">
                        Twitter
                    </Link>
                    <Link href="https://github.com/thetruesammyjay/ZibaXeer" className="hover:text-foreground">
                        GitHub
                    </Link>
                    <Link href="https://discord.gg/ZibaXeer" className="hover:text-foreground">
                        Discord
                    </Link>
                </div>
            </div>
        </footer>
    )
}
