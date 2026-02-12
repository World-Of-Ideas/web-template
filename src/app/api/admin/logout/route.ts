import { cookies } from "next/headers";
import { apiSuccess } from "@/lib/api";
import { deleteSession } from "@/lib/admin";

export async function POST() {
	const cookieStore = await cookies();
	const sessionId = cookieStore.get("admin_session")?.value;

	if (sessionId) {
		await deleteSession(sessionId);
	}

	cookieStore.delete({ name: "admin_session", path: "/" });

	return apiSuccess({ success: true });
}
