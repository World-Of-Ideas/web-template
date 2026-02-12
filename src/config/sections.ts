import type { SectionListingConfig } from "@/types/content";

/**
 * Static section configuration for listing pages.
 * Maps section identifiers to their display configuration.
 */
export const sectionConfigs: Record<string, SectionListingConfig> = {
	blog: {
		gridCols: 2,
		cardVariant: "default",
		itemsPerPage: 12,
		showBadges: true,
		cardLabel: "Read More",
	},
	guides: {
		gridCols: 2,
		cardVariant: "default",
		itemsPerPage: 20,
		showBadges: false,
		cardLabel: "Read Guide",
	},
	resources: {
		gridCols: 3,
		cardVariant: "compact",
		itemsPerPage: 20,
		showBadges: false,
		cardLabel: "View",
	},
};

export function getSectionConfig(section: string): SectionListingConfig {
	return sectionConfigs[section] ?? sectionConfigs.blog;
}
