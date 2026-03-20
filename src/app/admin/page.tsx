import type { Metadata } from "next";
import { getSiteSettingsDirect } from "@/lib/site-settings";
import { LoginForm } from "@/components/admin/login-form";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
	const settings = await getSiteSettingsDirect();
	return {
		title: `Admin Login | ${settings.name}`,
	};
}

export default function AdminLoginPage() {
	return (
		<div className="flex min-h-screen items-center justify-center px-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<CardTitle className="text-xl">Admin Login</CardTitle>
					<CardDescription>
						Enter your password to access the admin panel.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<LoginForm />
				</CardContent>
			</Card>
		</div>
	);
}
