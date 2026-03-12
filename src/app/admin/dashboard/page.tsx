import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/site-settings";
import { getSubscriberCount } from "@/lib/waitlist";
import { getPostCount } from "@/lib/blog";
import { getContactCount } from "@/lib/contact";
import { getSignupTrend, getContactTrend, getTopReferrers } from "@/lib/dashboard";
import { SignupChart } from "@/components/admin/signup-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
	title: "Dashboard",
};

function StatsCard({
	title,
	value,
}: {
	title: string;
	value: number;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm font-medium text-muted-foreground">
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-3xl font-bold">{value}</p>
			</CardContent>
		</Card>
	);
}

export default async function DashboardPage() {
	const settings = await getSiteSettings();

	const [postCount, contactCount, subscriberCount, signupTrend, contactTrend, topReferrers] = await Promise.all([
		settings.features.blog ? getPostCount() : Promise.resolve(0),
		settings.features.contact ? getContactCount() : Promise.resolve(0),
		settings.features.waitlist ? getSubscriberCount() : Promise.resolve(0),
		settings.features.waitlist ? getSignupTrend(30) : Promise.resolve([]),
		settings.features.contact ? getContactTrend(30) : Promise.resolve([]),
		settings.features.waitlist ? getTopReferrers(5) : Promise.resolve([]),
	]);

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Dashboard</h1>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{settings.features.waitlist && (
					<StatsCard title="Subscribers" value={subscriberCount} />
				)}
				{settings.features.blog && (
					<StatsCard title="Published Posts" value={postCount} />
				)}
				{settings.features.contact && (
					<StatsCard title="Contact Submissions" value={contactCount} />
				)}
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{settings.features.waitlist && (
					<Card>
						<CardHeader>
							<CardTitle className="text-sm font-medium">Signups (Last 30 Days)</CardTitle>
						</CardHeader>
						<CardContent>
							<SignupChart data={signupTrend} label="signup" />
						</CardContent>
					</Card>
				)}
				{settings.features.contact && (
					<Card>
						<CardHeader>
							<CardTitle className="text-sm font-medium">Contact Submissions (Last 30 Days)</CardTitle>
						</CardHeader>
						<CardContent>
							<SignupChart data={contactTrend} label="contact" />
						</CardContent>
					</Card>
				)}
			</div>

			{settings.features.waitlist && topReferrers.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Top Referrers</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{topReferrers.map((r) => (
								<div key={r.referralCode} className="flex items-center justify-between text-sm">
									<div>
										<span className="font-medium">{r.name}</span>
										<span className="ml-2 text-muted-foreground">{r.email}</span>
									</div>
									<span className="font-semibold">{r.referralCount} referrals</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
