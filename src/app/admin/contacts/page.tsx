import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteSettingsDirect } from "@/lib/site-settings";
import { getContactSubmissions } from "@/lib/contact";
import { ExportCsvButton } from "@/components/admin/export-csv-button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
	title: "Contacts | Admin",
};

export default async function ContactsPage() {
	const settings = await getSiteSettingsDirect();
	if (!settings.features.contact) notFound();

	const { items: contacts, total } = await getContactSubmissions(1, 50);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Contact Submissions</h1>
				<div className="flex items-center gap-4">
					<p className="text-sm text-muted-foreground">
						{total} total submission{total !== 1 ? "s" : ""}
					</p>
					<ExportCsvButton
						endpoint="/api/admin/contacts/export"
						headers={["Name", "Email", "Message", "Source", "Date"]}
						keys={["name", "email", "message", "source", "createdAt"]}
						filename="contacts.csv"
					/>
				</div>
			</div>

			{contacts.length === 0 ? (
				<p className="text-muted-foreground">No contact submissions yet.</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Message</TableHead>
							<TableHead>Source</TableHead>
							<TableHead>Date</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{contacts.map((contact) => (
							<TableRow key={contact.id}>
								<TableCell className="font-medium">
									{contact.name}
								</TableCell>
								<TableCell>{contact.email}</TableCell>
								<TableCell className="max-w-[300px] truncate">
									{contact.message}
								</TableCell>
								<TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
									{contact.source ?? "\u2014"}
								</TableCell>
								<TableCell className="text-muted-foreground">
									{new Date(
										contact.createdAt,
									).toLocaleDateString()}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
