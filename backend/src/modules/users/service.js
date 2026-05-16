import fs from "node:fs/promises";
import path from "node:path";
import { ContentStatus } from "@prisma/client";
import { ApiError } from "../../common/api-error.js";
import { buildProfileDetailsData } from "../../common/profile-details.js";
import { prisma } from "../../lib/prisma.js";
import { serializeUser } from "../auth/service.js";
import { readingShelfDefinitions } from "../social/service.js";
import { avatarsDirectory } from "./upload.js";

function profileBookSelect() {
  return {
    id: true,
    title: true,
    description: true,
    coverUrl: true,
    bookAuthors: {
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        authorOrder: "asc",
      },
    },
  };
}

function profileInclude(viewerId) {
  return {
    featuredBooks: {
      orderBy: { sortOrder: "asc" },
      include: {
        book: {
          select: profileBookSelect(),
        },
      },
    },
    favorites: {
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        book: {
          select: profileBookSelect(),
        },
      },
    },
    ratings: {
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: {
        book: {
          select: profileBookSelect(),
        },
      },
    },
    reviews: {
      where: { status: ContentStatus.PUBLISHED },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            coverUrl: true,
          },
        },
      },
    },
    followers: viewerId
      ? {
          where: { followerId: viewerId },
          select: {
            followerId: true,
          },
        }
      : false,
    following: {
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        following: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
    },
    _count: {
      select: {
        followers: true,
        following: true,
        ratings: true,
        reviews: true,
        favorites: true,
      },
    },
  };
}

function userCard(user) {
  return {
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
  };
}

function bookPreview(book) {
  return {
    id: book.id,
    title: book.title,
    description: book.description,
    coverUrl: book.coverUrl,
    authors: (book.bookAuthors ?? []).map((item) => ({
      id: item.author.id,
      fullName: item.author.fullName,
    })),
  };
}

async function getUserRatingAverages(userId) {
  const averages = await prisma.rating.aggregate({
    where: { userId },
    _avg: {
      architecture: true,
      characters: true,
      language: true,
      idea: true,
      vibe: true,
      finalScore: true,
    },
  });

  return {
    architecture: Number((averages._avg.architecture ?? 0).toFixed(2)),
    characters: Number((averages._avg.characters ?? 0).toFixed(2)),
    language: Number((averages._avg.language ?? 0).toFixed(2)),
    idea: Number((averages._avg.idea ?? 0).toFixed(2)),
    vibe: Number((averages._avg.vibe ?? 0).toFixed(2)),
    finalScore: Number((averages._avg.finalScore ?? 0).toFixed(2)),
  };
}

async function getReadingShelfSummary(userId) {
  const collections = await prisma.collection.findMany({
    where: {
      userId,
      title: {
        in: readingShelfDefinitions.map((item) => item.title),
      },
    },
    include: {
      _count: {
        select: {
          collectionBooks: true,
        },
      },
    },
  });

  return readingShelfDefinitions.map((shelf) => {
    const collection = collections.find((item) => item.title === shelf.title);
    return {
      key: shelf.key,
      title: shelf.title,
      bookCount: collection?._count.collectionBooks ?? 0,
    };
  });
}

function serializeProfile(user, options = {}) {
  const viewerId = options.viewerId ?? null;
  const isOwner = viewerId === user.id;

  return {
    ...serializeUser(user),
    email: isOwner ? user.email : undefined,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    settings: isOwner
      ? {
          showRatings: user.showRatings,
          showReviews: user.showReviews,
          showFavorites: user.showFavorites,
          showLibrary: user.showLibrary,
        }
      : undefined,
    followersCount: user._count?.followers ?? 0,
    followingCount: user._count?.following ?? 0,
    ratingsCount: user._count?.ratings ?? 0,
    reviewsCount: user._count?.reviews ?? 0,
    favoritesCount: user._count?.favorites ?? 0,
    isFollowing: isOwner ? false : Boolean(viewerId && user.followers?.length),
    featuredBooks: (user.featuredBooks ?? []).map((item) =>
      bookPreview(item.book),
    ),
    favoriteBooks:
      isOwner || user.showFavorites
        ? (user.favorites ?? []).map((item) => bookPreview(item.book))
        : [],
    ratedBooks:
      isOwner || user.showRatings
        ? (user.ratings ?? []).map((item) => ({
            architecture: item.architecture,
            characters: item.characters,
            language: item.language,
            idea: item.idea,
            vibe: item.vibe,
            finalScore: item.finalScore,
            updatedAt: item.updatedAt,
            book: bookPreview(item.book),
          }))
        : [],
    reviews:
      isOwner || user.showReviews
        ? (user.reviews ?? []).map((item) => ({
            id: item.id,
            title: item.title,
            body: item.body,
            createdAt: item.createdAt,
            book: item.book,
          }))
        : [],
    followingPreview: (user.following ?? []).map((item) =>
      userCard(item.following),
    ),
    shelfSummary: options.shelfSummary ?? [],
    ratingAverages: options.ratingAverages ?? {
      architecture: 0,
      characters: 0,
      language: 0,
      idea: 0,
      vibe: 0,
      finalScore: 0,
    },
  };
}

async function ensureUniqueIdentity(userId, payload) {
  const filters = [
    payload.email ? { email: payload.email } : null,
    payload.username ? { username: payload.username } : null,
  ].filter(Boolean);
  if (!filters.length) {
    return;
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: filters,
      NOT: { id: userId },
    },
  });

  if (existing) {
    throw ApiError.conflict("Username or email is already taken");
  }
}

async function validateFeaturedBooks(featuredBookIds) {
  if (!featuredBookIds) {
    return;
  }

  if (featuredBookIds.length > 5) {
    throw ApiError.badRequest("You can feature up to 5 books on your profile");
  }

  const total = await prisma.book.count({
    where: {
      id: {
        in: featuredBookIds,
      },
    },
  });

  if (total !== featuredBookIds.length) {
    throw ApiError.badRequest("Some selected books do not exist");
  }
}

export async function getOwnProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: profileInclude(userId),
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const shelfSummary = await getReadingShelfSummary(userId);
  const ratingAverages = await getUserRatingAverages(userId);
  return serializeProfile(user, {
    viewerId: userId,
    shelfSummary,
    ratingAverages,
  });
}

export async function updateProfile(userId, payload) {
  await ensureUniqueIdentity(userId, payload);
  await validateFeaturedBooks(payload.featuredBookIds);

  await prisma.$transaction(async (tx) => {
    const data = {};

    if (payload.username !== undefined) data.username = payload.username;
    if (payload.email !== undefined) data.email = payload.email;
    Object.assign(data, buildProfileDetailsData(payload));
    if (payload.avatarUrl !== undefined) data.avatarUrl = payload.avatarUrl;
    if (payload.bio !== undefined) data.bio = payload.bio;
    if (payload.showRatings !== undefined)
      data.showRatings = payload.showRatings;
    if (payload.showReviews !== undefined)
      data.showReviews = payload.showReviews;
    if (payload.showFavorites !== undefined)
      data.showFavorites = payload.showFavorites;
    if (payload.showLibrary !== undefined)
      data.showLibrary = payload.showLibrary;

    if (Object.keys(data).length) {
      await tx.user.update({
        where: { id: userId },
        data,
      });
    }

    if (payload.featuredBookIds !== undefined) {
      await tx.profileFeaturedBook.deleteMany({
        where: { userId },
      });

      if (payload.featuredBookIds.length) {
        await tx.profileFeaturedBook.createMany({
          data: payload.featuredBookIds.map((bookId, index) => ({
            userId,
            bookId,
            sortOrder: index,
          })),
        });
      }
    }
  });

  return getOwnProfile(userId);
}

function isManagedAvatar(avatarUrl) {
  return (
    typeof avatarUrl === "string" && avatarUrl.startsWith("/uploads/avatars/")
  );
}

async function removeManagedAvatar(avatarUrl) {
  if (!isManagedAvatar(avatarUrl)) {
    return;
  }

  const filename = path.basename(avatarUrl);
  if (!filename) {
    return;
  }

  try {
    await fs.unlink(path.join(avatarsDirectory, filename));
  } catch {
    // If the file has already been removed, profile update should still succeed.
  }
}

export async function updateAvatar(userId, filename) {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  });

  if (!currentUser) {
    throw ApiError.notFound("User not found");
  }

  const avatarUrl = `/uploads/avatars/${filename}`;

  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
  });

  await removeManagedAvatar(currentUser.avatarUrl);

  return getOwnProfile(userId);
}

export async function getPublicProfile(username, viewerId) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: profileInclude(viewerId),
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const shelfSummary = user.showLibrary
    ? await getReadingShelfSummary(user.id)
    : [];
  const ratingAverages =
    user.showRatings || viewerId === user.id
      ? await getUserRatingAverages(user.id)
      : undefined;
  return serializeProfile(user, { viewerId, shelfSummary, ratingAverages });
}

export async function followUser(viewerId, username) {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (user.id === viewerId) {
    throw ApiError.badRequest("You cannot follow yourself");
  }

  await prisma.userFollow.upsert({
    where: {
      followerId_followingId: {
        followerId: viewerId,
        followingId: user.id,
      },
    },
    update: {},
    create: {
      followerId: viewerId,
      followingId: user.id,
    },
  });

  return getPublicProfile(username, viewerId);
}

export async function unfollowUser(viewerId, username) {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  await prisma.userFollow.deleteMany({
    where: {
      followerId: viewerId,
      followingId: user.id,
    },
  });

  return getPublicProfile(username, viewerId);
}

export async function discoverUsers(viewerId, query = "") {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      NOT: viewerId ? { id: viewerId } : undefined,
      username: query
        ? {
            contains: query,
            mode: "insensitive",
          }
        : undefined,
    },
    take: 8,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      featuredBooks: {
        orderBy: { sortOrder: "asc" },
        take: 1,
        include: {
          book: true,
        },
      },
      followers: viewerId
        ? {
            where: { followerId: viewerId },
            select: { followerId: true },
          }
        : false,
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
    },
  });

  return users.map((user) => ({
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    featuredCoverUrl: user.featuredBooks[0]?.book.coverUrl ?? null,
    followersCount: user._count.followers,
    followingCount: user._count.following,
    isFollowing: Boolean(viewerId && user.followers?.length),
  }));
}
