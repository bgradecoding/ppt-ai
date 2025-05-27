import "server-only";
// import { auth } from "@/server/auth"; // Removed auth import
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";

const f = createUploadthing();

export const utapi = new UTApi();
// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({}) => {
      // This code runs on your server before upload
      // const session = await auth(); // Removed auth check

      // console.log(session); // Removed
      // If you throw, the user will not be able to upload
      // if (!session) throw new UploadThingError("Unauthorized"); // Removed auth check

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      // For now, returning an empty object or some non-user-specific metadata if needed
      return { uploadedBy: "anonymous" }; // Or simply return {};
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      // console.log("Upload complete for userId:", metadata.userId); // metadata.userId removed
      console.log("Upload complete for:", metadata.uploadedBy); // Using new metadata field

      console.log("file url", file.url);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.uploadedBy }; // Returning the same metadata
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
