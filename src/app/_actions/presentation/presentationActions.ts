"use server";

import { type PlateSlide } from "@/components/presentation/utils/parser";
// import { auth } from "@/server/auth"; // Removed auth import
import { db } from "@/server/db"; // Existing prisma client import, will use this.
import { type InputJsonValue } from "@prisma/client/runtime/library";

// Imports for generatePresentationFromTemplate
import PptxGenJS from 'pptxgenjs';
import { masterDefinitions } from '@/lib/presentation/pptxgenjsMasters';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';


// Interface definitions for generatePresentationFromTemplate
interface SlideData {
  masterName: keyof typeof masterDefinitions;
  data: { [placeholder: string]: string }; 
}

interface GeneratePresentationInput {
  masterSetName?: string;
  slidesData: SlideData[];
  newPresentationTitle: string;
  userId: string; 
  templateUploadId?: string;
}

export async function generatePresentationFromTemplate(input: GeneratePresentationInput) {
  'use server';
  try {
    const pptx = new PptxGenJS();

    // Define masters in the pptx instance
    Object.values(masterDefinitions).forEach(masterDef => {
      pptx.defineSlideMaster(masterDef);
    });

    // Add slides
    input.slidesData.forEach(slideDef => {
      const slide = pptx.addSlide({ masterName: slideDef.masterName });
      for (const placeholderName in slideDef.data) {
        const value = slideDef.data[placeholderName];
        // Basic handling: if value looks like an image URL or data URI, try addImage, else addText
        if ((placeholderName.toLowerCase().includes('image') || placeholderName.toLowerCase().includes('logo') || placeholderName.toLowerCase().includes('picture')) && 
            (value.startsWith('http') || value.startsWith('data:image'))) {
          slide.addImage({ path: value, placeholder: placeholderName });
        } else {
          slide.addText(value, { placeholder: placeholderName });
        }
      }
    });

    const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'generated_presentations');
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const uniqueFilename = `${uuidv4()}.pptx`;
    const outputPath = path.join(UPLOAD_DIR, uniqueFilename);

    await pptx.writeFile({ fileName: outputPath });

    // Create BaseDocument and Presentation records
    // Using existing 'db' import for Prisma client.
    const baseDocument = await db.baseDocument.create({
      data: {
        title: input.newPresentationTitle,
        userId: input.userId,
        type: 'PRESENTATION',
        documentType: 'PRESENTATION', 
        isPublic: false, 
      },
    });

    const presentation = await db.presentation.create({
      data: {
        id: baseDocument.id, 
        content: input.slidesData as any, // Store input slide data as JSON
        theme: input.masterSetName || 'DefaultMasters', 
        templateUsedId: input.templateUploadId,
        generatedFilePath: outputPath,
      },
    });

    return { success: true, presentationId: baseDocument.id, filePath: outputPath };

  } catch (error) {
    console.error('Error generating presentation:', error);
    if (error instanceof Error) {
      return { success: false, error: `Failed to generate presentation: ${error.message}` };
    }
    return { success: false, error: 'An unknown error occurred while generating the presentation.' };
  }
}

export async function exportPresentationToPptx(presentationId: string) {
  "use server";

  try {
    // Fetch Presentation Data
    const presentationDocument = await db.baseDocument.findUnique({
      where: { id: presentationId },
      include: {
        presentation: true,
      },
    });

    if (!presentationDocument?.presentation) {
      return { success: false, error: "Presentation not found" };
    }

    const presentationContent = presentationDocument.presentation.content as unknown as { slides: PlateSlide[] };

    // Initialize PptxGenJS
    const pptx = new PptxGenJS();

    // Define masters in the pptx instance
    Object.values(masterDefinitions).forEach(masterDef => {
      pptx.defineSlideMaster(masterDef);
    });

    // Process Slides
    if (presentationContent?.slides) {
      for (const slide of presentationContent.slides) { // slide is PlateSlide
        const pptxSlide = pptx.addSlide({ masterName: "CONTENT_MASTER" });
        let textContent = "";

        // PlateSlide.content is an array of PlateNode
        // PlateNode is TElement which has children (TDescendant[])
        if (slide.content && Array.isArray(slide.content)) {
          for (const node of slide.content) { // node is PlateNode (TElement)
            if (node.type === 'img' && 'url' in node && typeof node.url === 'string') {
              // Basic Image Handling
              const imageUrl = node.url;
              if (imageUrl) {
                pptxSlide.addImage({ path: imageUrl, x: 1, y: 1, w: 8, h: 4.5 });
              }
            } else if (node.children && Array.isArray(node.children)) {
              // Handle text-based elements (paragraphs, headings, etc.)
              for (const child of node.children) { // child is TDescendant (TElement or TText)
                if (child && 'text' in child && typeof child.text === 'string') {
                  textContent += child.text + "\n"; // Add newline between text pieces
                }
              }
            }
          }
        }
        
        // Add concatenated text to bodyPlaceholder if there's any text
        if (textContent.trim().length > 0) {
          pptxSlide.addText(textContent.trim(), { placeholder: "bodyPlaceholder" });
        }
      }
    }

    // File Generation
    const UPLOAD_DIR = path.join(process.cwd(), "uploads", "generated_presentations");
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const uniqueFilename = `${uuidv4()}.pptx`;
    const outputPath = path.join(UPLOAD_DIR, uniqueFilename);

    await pptx.writeFile({ fileName: outputPath });

    return { success: true, filePath: outputPath };

  } catch (error) {
    console.error("Error exporting presentation to PPTX:", error);
    if (error instanceof Error) {
      return { success: false, error: `Failed to export presentation: ${error.message}` };
    }
    return { success: false, error: "An unknown error occurred while exporting the presentation." };
  }
}


export async function createPresentation(
  content: {
    slides: PlateSlide[];
  },
  title: string,
  theme = "default",
  outline?: string[],
  imageModel?: string,
  presentationStyle?: string,
  language?: string
) {
  // const session = await auth(); // Removed auth check
  // if (!session?.user) {
  //   throw new Error("Unauthorized");
  // }
  // const userId = session.user.id; // Removed userId

  try {
    const presentation = await db.baseDocument.create({
      data: {
        type: "PRESENTATION",
        documentType: "presentation",
        title: title ?? "Untitled Presentation",
        // userId, // Removed userId
        presentation: {
          create: {
            content: content as unknown as InputJsonValue,
            theme: theme,
            imageModel,
            presentationStyle,
            language,
            outline: outline,
          },
        },
      },
      include: {
        presentation: true,
      },
    });

    return {
      success: true,
      message: "Presentation created successfully",
      presentation,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to create presentation",
    };
  }
}

export async function createEmptyPresentation(
  title: string,
  theme = "default"
) {
  const emptyContent: { slides: PlateSlide[] } = { slides: [] };

  return createPresentation(emptyContent, title, theme);
}

export async function updatePresentation({
  id,
  content,
  title,
  theme,
  outline,
  imageModel,
  presentationStyle,
  language,
}: {
  id: string;
  content?: {
    slides: PlateSlide[];
  };
  title?: string;
  theme?: string;
  outline?: string[];
  imageModel?: string;
  presentationStyle?: string;
  language?: string;
}) {
  // const session = await auth(); // Removed auth check
  // if (!session?.user) {
  //   throw new Error("Unauthorized");
  // }

  try {
    // Extract values from content if provided there
    const effectiveTheme = theme;
    const effectiveImageModel = imageModel;
    const effectivePresentationStyle = presentationStyle;
    const effectiveLanguage = language;

    // Update base document with all presentation data
    const presentation = await db.baseDocument.update({
      where: { id },
      data: {
        title: title,
        presentation: {
          update: {
            content: content as unknown as InputJsonValue,
            theme: effectiveTheme,
            imageModel: effectiveImageModel,
            presentationStyle: effectivePresentationStyle,
            language: effectiveLanguage,
            outline,
          },
        },
      },
      include: {
        presentation: true,
      },
    });

    return {
      success: true,
      message: "Presentation updated successfully",
      presentation,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to update presentation",
    };
  }
}

export async function updatePresentationTitle(id: string, title: string) {
  // const session = await auth(); // Removed auth check
  // if (!session?.user) {
  //   throw new Error("Unauthorized");
  // }

  try {
    const presentation = await db.baseDocument.update({
      where: { id },
      data: { title },
      include: {
        presentation: true,
      },
    });

    return {
      success: true,
      message: "Presentation title updated successfully",
      presentation,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to update presentation title",
    };
  }
}

export async function deletePresentation(id: string) {
  return deletePresentations([id]);
}

export async function deletePresentations(ids: string[]) {
  // const session = await auth(); // Removed auth check
  // if (!session?.user) {
  //   throw new Error("Unauthorized");
  // }

  try {
    // Delete the base documents using deleteMany (this will cascade delete the presentations)
    // userId filter removed, allowing deletion of any presentation by ID
    const result = await db.baseDocument.deleteMany({
      where: {
        id: {
          in: ids,
        },
        // userId: session.user.id, // Ensure only user's own presentations can be deleted
      },
    });

    const deletedCount = result.count;
    const failedCount = ids.length - deletedCount;

    if (failedCount > 0) {
      return {
        success: deletedCount > 0,
        message:
          deletedCount > 0
            ? `Deleted ${deletedCount} presentations, failed to delete ${failedCount} presentations`
            : "Failed to delete presentations",
        partialSuccess: deletedCount > 0,
      };
    }

    return {
      success: true,
      message:
        ids.length === 1
          ? "Presentation deleted successfully"
          : `${deletedCount} presentations deleted successfully`,
    };
  } catch (error) {
    console.error("Failed to delete presentations:", error);
    return {
      success: false,
      message: "Failed to delete presentations",
    };
  }
}

// Get the presentation with the presentation content
export async function getPresentation(id: string) {
  // const session = await auth(); // Removed auth check
  // if (!session?.user) {
  //   throw new Error("Unauthorized");
  // }

  try {
    const presentation = await db.baseDocument.findUnique({
      where: { id },
      include: {
        presentation: true,
      },
    });

    return {
      success: true,
      presentation,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to fetch presentation",
    };
  }
}

export async function getPresentationContent(id: string) {
  // const session = await auth(); // Removed auth check
  // if (!session?.user) {
  //   throw new Error("Unauthorized");
  // }

  try {
    const presentation = await db.baseDocument.findUnique({
      where: { id },
      include: {
        presentation: {
          select: {
            id: true,
            content: true,
            theme: true,
            outline: true,
          },
        },
      },
    });

    if (!presentation) {
      return {
        success: false,
        message: "Presentation not found",
      };
    }

    // Check if the user has access to this presentation - REMOVED
    // if (presentation.userId !== session.user.id && !presentation.isPublic) {
    //   return {
    //     success: false,
    //     message: "Unauthorized access",
    //   };
    // }

    return {
      success: true,
      presentation: presentation.presentation,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to fetch presentation",
    };
  }
}

export async function updatePresentationTheme(id: string, theme: string) {
  // const session = await auth(); // Removed auth check
  // if (!session?.user) {
  //   throw new Error("Unauthorized");
  // }

  try {
    const presentation = await db.presentation.update({
      where: { id },
      data: { theme },
    });

    return {
      success: true,
      message: "Presentation theme updated successfully",
      presentation,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to update presentation theme",
    };
  }
}

export async function duplicatePresentation(id: string, newTitle?: string) {
  // const session = await auth(); // Removed auth check
  // if (!session?.user) {
  //   throw new Error("Unauthorized");
  // }

  try {
    // Get the original presentation
    const original = await db.baseDocument.findUnique({
      where: { id },
      include: {
        presentation: true,
      },
    });

    if (!original?.presentation) {
      return {
        success: false,
        message: "Original presentation not found",
      };
    }

    // Create a new presentation with the same content
    const duplicated = await db.baseDocument.create({
      data: {
        type: "PRESENTATION",
        documentType: "presentation",
        title: newTitle ?? `${original.title} (Copy)`,
        // userId: session.user.id, // Removed userId
        isPublic: false, // Kept isPublic behavior for now
        presentation: {
          create: {
            content: original.presentation.content as unknown as InputJsonValue,
            theme: original.presentation.theme,
          },
        },
      },
      include: {
        presentation: true,
      },
    });

    return {
      success: true,
      message: "Presentation duplicated successfully",
      presentation: duplicated,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to duplicate presentation",
    };
  }
}
