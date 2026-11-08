import Link from "next/link";

type LogoProps = {
    className?: string;
};

const Logo = ({ className }: LogoProps) => {
    return (
        <Link
            className={`flex shrink-0 items-center opacity-100 md:justify-center md:w-12 md:h-12 md:px-2 ${
                className || ""
            }`}
            href="/"
        >
            <span className="text-h5 font-semibold tracking-tight text-n-7 dark:text-n-1 md:hidden">
                letícia
            </span>
            <span className="hidden w-8 h-8 items-center justify-center rounded-full bg-primary-1 text-base-1 font-semibold text-n-1 md:flex">
                l
            </span>
        </Link>
    );
};

export default Logo;
