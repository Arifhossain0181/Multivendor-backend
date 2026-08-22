import { prisma } from "../../prisma/client.js";
import { ApiError } from "../../utlits/ApiError.js";

export const getPageContent = async (key: string) => {
  const content = await prisma.pageContent.findUnique({
    where: { key },
  });

  if (!content) {
    throw new ApiError(404, "NOT_FOUND", "Page content not found");
  }

  return content;
};

export const upsertPageContent = async (key: string, content: string) => {
  const updated = await prisma.pageContent.upsert({
    where: { key },
    update: { content },
    create: { key, content },
  });

  return updated;
};
