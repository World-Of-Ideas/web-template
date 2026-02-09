import { getEnv } from "@/db";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ key: string[] }> },
) {
	const { key: segments } = await params;
	const key = segments.join("/");

	const env = await getEnv();
	const bucket = (env as unknown as Record<string, unknown>)
		.ASSETS_BUCKET as R2Bucket;
	const object = await bucket.get(key);

	if (!object) {
		return new Response("Not Found", { status: 404 });
	}

	return new Response(object.body as ReadableStream, {
		headers: {
			"Content-Type":
				object.httpMetadata?.contentType ?? "application/octet-stream",
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
}
