import Link from "next/link";

interface CtaSectionProps {
	title: string;
	description: string;
	buttonText: string;
	buttonHref: string;
}

export function CtaSection({ title, description, buttonText, buttonHref }: CtaSectionProps) {
	return (
		<section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24">
			<div className="absolute inset-0 gradient-purple-br" aria-hidden="true" />
			<div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" aria-hidden="true" />
			<div className="relative mx-auto max-w-3xl text-center">
				<h2 className="text-2xl font-normal tracking-tight text-white sm:text-3xl md:text-4xl">
					{title}
				</h2>
				<p className="mt-4 text-base text-white/70 sm:text-lg">
					{description}
				</p>
				<div className="mt-8">
					<Link
						href={buttonHref}
						className="inline-block rounded-full bg-white px-8 py-3 text-sm font-medium text-black transition-colors hover:bg-white/90"
					>
						{buttonText}
					</Link>
				</div>
			</div>
		</section>
	);
}
