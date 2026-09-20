import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { canManageBuilds } from "@/lib/session";

export const runtime = "nodejs";

/**
 * Client-upload handler for Vercel Blob. The browser uploads the APK directly
 * to Blob (bypassing the ~4.5 MB serverless body limit); this route only issues
 * a short-lived upload token, and only to signed-in ADMIN users. Files are
 * stored under the "Soubory/" prefix.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!(await canManageBuilds())) {
          throw new Error("Nahrávat smí jen administrátor nebo povolená IP");
        }
        return {
          allowedContentTypes: [
            "application/vnd.android.package-archive",
            "application/octet-stream",
          ],
          addRandomSuffix: false,
          allowOverwrite: true, // stejná verze přepíše původní soubor
          maximumSizeInBytes: 500 * 1024 * 1024, // 500 MB
        };
      },
      // Runs after the upload finishes (server-to-server callback).
      onUploadCompleted: async () => {
        // The DB row is created separately via POST /api/apps.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload selhal" },
      { status: 400 }
    );
  }
}
