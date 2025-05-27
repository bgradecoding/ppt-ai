import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { exportPresentationToPptx } from '@/app/_actions/presentation/presentationActions';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const presentationId = params.id;

  if (!presentationId) {
    return NextResponse.json({ error: "Presentation ID is required" }, { status: 400 });
  }

  try {
    const actionResult = await exportPresentationToPptx(presentationId);

    if (actionResult.success && actionResult.filePath) {
      try {
        const fileBuffer = await fs.readFile(actionResult.filePath);
        
        const response = new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'Content-Disposition': `attachment; filename="presentation.pptx"`,
          },
        });

        // Clean up the file after creating the response
        try {
          await fs.unlink(actionResult.filePath);
        } catch (unlinkError) {
          // Log unlink error, but don't fail the request if file was already sent
          console.error("Error deleting temporary presentation file:", unlinkError);
        }

        return response;

      } catch (fileReadError) {
        console.error("Error reading presentation file:", fileReadError);
        // If reading the file fails, it's a server error
        return NextResponse.json({ error: "Failed to read presentation file" }, { status: 500 });
      }
    } else {
      if (actionResult.error?.toLowerCase().includes("not found")) {
        return NextResponse.json({ error: actionResult.error || "Presentation not found" }, { status: 404 });
      }
      return NextResponse.json({ error: actionResult.error || "Failed to export presentation" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error exporting presentation:", error);
    // Generic error for any other unexpected issues
    return NextResponse.json({ error: "An unexpected error occurred during presentation export" }, { status: 500 });
  }
}
