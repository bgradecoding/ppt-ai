"use server";
import "server-only";

// import { auth } from "@/server/auth"; // Removed auth import
import { db } from "@/server/db";
import { type Prisma, DocumentType } from "@prisma/client";

export type PresentationDocument = Prisma.BaseDocumentGetPayload<{
  include: {
    presentation: true;
  };
}>;

const ITEMS_PER_PAGE = 10;

export async function fetchPresentations(page = 0) {
  // User authentication removed
  // const session = await auth();
  // const userId = session?.user.id;

  // if (!userId) {
  //   return {
  //     items: [],
  //     hasMore: false,
  //   };
  // }

  const skip = page * ITEMS_PER_PAGE;

  // Modified to fetch all presentations, not just for a specific user
  const items = await db.baseDocument.findMany({
    where: {
      type: DocumentType.PRESENTATION,
      // userId filter removed
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: ITEMS_PER_PAGE,
    skip: skip,
    include: {
      presentation: true,
    },
  });

  const hasMore = items.length === ITEMS_PER_PAGE;

  return {
    items,
    hasMore,
  };
}

export async function fetchPublicPresentations(page = 0) {
  const skip = page * ITEMS_PER_PAGE;

  const [items, total] = await Promise.all([
    db.baseDocument.findMany({
      where: {
        type: DocumentType.PRESENTATION,
        isPublic: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: ITEMS_PER_PAGE,
      skip: skip,
      include: {
        presentation: true,
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    }),
    db.baseDocument.count({
      where: {
        type: DocumentType.PRESENTATION,
        isPublic: true,
      },
    }),
  ]);

  const hasMore = skip + ITEMS_PER_PAGE < total;

  return {
    items,
    hasMore,
  };
}

export async function fetchUserPresentations(userId: string, page = 0) {
  // User authentication removed for currentUserId
  // const session = await auth();
  // const currentUserId = session?.user.id;

  const skip = page * ITEMS_PER_PAGE;

  const [items, total] = await Promise.all([
    db.baseDocument.findMany({
      where: {
        userId, // Fetch presentations for the specified userId
        type: DocumentType.PRESENTATION,
        isPublic: true, // Only fetch public presentations of this user
        // OR: [
        //   { isPublic: true },
        //   { userId: currentUserId }, // Logic relying on currentUserId removed
        // ],
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: ITEMS_PER_PAGE,
      skip: skip,
      include: {
        presentation: true,
      },
    }),
    db.baseDocument.count({
      where: {
        userId, // Count presentations for the specified userId
        type: DocumentType.PRESENTATION,
        isPublic: true, // Only count public presentations of this user
        // OR: [{ isPublic: true }, { userId: currentUserId }], // Logic relying on currentUserId removed
      },
    }),
  ]);

  const hasMore = skip + ITEMS_PER_PAGE < total;

  return {
    items,
    hasMore,
  };
}
