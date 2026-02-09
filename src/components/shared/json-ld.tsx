interface JsonLdProps {
	data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
	// Escape angle brackets to prevent </script> breakout in inline JSON-LD
	const json = JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: json }}
		/>
	);
}
