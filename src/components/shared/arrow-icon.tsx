import { cn } from "@/lib/utils";

interface ArrowIconProps {
	className?: string;
}

export function ArrowIcon({ className }: ArrowIconProps) {
	return (
		<svg
			className={cn("h-5 w-5 text-primary", className)}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M7 17L17 7" />
			<path d="M7 7h10v10" />
		</svg>
	);
}
