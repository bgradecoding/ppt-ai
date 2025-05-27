"use server";

import { env } from "@/env";
import OpenAI from "openai";
import { db } from "@/server/db";
// import { auth } from "@/server/auth"; // Removed auth import
import { utapi } from "@/app/api/uploadthing/core";
import { UTFile } from "uploadthing/server";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export type ImageModelList = "dall-e-3" | "dall-e-2";

export async function generateImageAction(
  prompt: string,
  model: ImageModelList = "dall-e-3" // Set default model
) {
  // User authentication removed
  // const session = await auth();
  // if (!session?.user?.id) {
  //   throw new Error("You must be logged in to generate images");
  // }

  try {
    console.log(`Generating image with model: ${model}`);

    // Generate the image using OpenAI
    const response = await openai.images.generate({
      model: model, // Use the model parameter
      prompt: prompt,
      n: 1,
      size: "1024x1024", // DALL-E 3 and DALL-E 2 support this size
    });

    const imageUrl = response.data[0]?.url;

    if (!imageUrl) {
      throw new Error("Failed to generate image with OpenAI");
    }

    console.log(`Generated image URL: ${imageUrl}`);

    // Download the image from OpenAI URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to download image from OpenAI");
    }

    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();

    // Generate a filename based on the prompt
    const filename = `${prompt.substring(0, 20).replace(/[^a-z0-9]/gi, "_")}_${Date.now()}.png`;

    // Create a UTFile from the downloaded image
    const utFile = new UTFile([new Uint8Array(imageBuffer)], filename);

    // Upload to UploadThing
    const uploadResult = await utapi.uploadFiles([utFile]);

    if (!uploadResult[0]?.data?.ufsUrl) {
      console.error("Upload error:", uploadResult[0]?.error);
      throw new Error("Failed to upload image to UploadThing");
    }

    console.log(uploadResult);
    const permanentUrl = uploadResult[0].data.ufsUrl;
    console.log(`Uploaded to UploadThing URL: ${permanentUrl}`);

    // Store in database with the permanent URL
    const generatedImage = await db.generatedImage.create({
      data: {
        url: permanentUrl, // Store the UploadThing URL instead of the Together AI URL
        prompt: prompt,
        // userId: session.user.id, // Removed userId
      },
    });

    return {
      success: true,
      image: generatedImage,
    };
  } catch (error) {
    console.error("Error generating image:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate image",
    };
  }
}
