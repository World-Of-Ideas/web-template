"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function BackToTop() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const onScroll = () => setVisible(window.scrollY > 400);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<button
			type="button"
			aria-label="Back to top"
			onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
			className={cn(
				"fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full border bg-background shadow-md transition-all duration-300 hover:bg-accent",
				visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
			)}
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
				<path d="m18 15-6-6-6 6"/>
			</svg>
		</button>
	);
}
