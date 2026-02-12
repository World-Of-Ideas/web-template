"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { JsonLd } from "@/components/shared/json-ld";
import type { FAQ } from "@/types/content";

interface FaqSectionProps {
	faqs: FAQ[];
}

export function FaqSection({ faqs }: FaqSectionProps) {
	if (!faqs || faqs.length === 0) return null;

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: faqs.map((faq) => ({
			"@type": "Question",
			name: faq.question,
			acceptedAnswer: {
				"@type": "Answer",
				text: faq.answer,
			},
		})),
	};

	return (
		<section className="my-12 mx-auto max-w-3xl px-4 sm:px-6">
			<JsonLd data={jsonLd} />
			<h2 className="mb-6 text-2xl font-bold">Frequently Asked Questions</h2>
			<Accordion type="single" collapsible className="w-full">
				{faqs.map((faq, index) => (
					<AccordionItem key={`faq-${index}-${faq.question.slice(0, 20)}`} value={`faq-${index}`}>
						<AccordionTrigger className="text-left">
							{faq.question}
						</AccordionTrigger>
						<AccordionContent>{faq.answer}</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
		</section>
	);
}
