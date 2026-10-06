export type Cursor = {
  createdAt: string;
  id: string;
};

export const encodeCursor = (cursor: Cursor): string => {
  return Buffer.from(JSON.stringify(cursor)).toString("base64");
};

export const decodeCursor = (encoded: string | null | undefined): Cursor | null => {
  if (!encoded) return null;
  try {
    const decoded = JSON.parse(Buffer.from(encoded, "base64").toString("utf-8"));
    if (decoded && typeof decoded.createdAt === "string" && typeof decoded.id === "string") {
      return decoded as Cursor;
    }
    return null;
  } catch {
    return null;
  }
};

export type PaginatedResult<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
};

export const buildCursorWhere = (baseWhere: any, cursor: Cursor | null): any => {
  if (!cursor) return baseWhere;
  const cursorCondition = {
    OR: [
      { createdAt: { lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, id: { lt: cursor.id } },
    ],
  };
  if (!baseWhere) return cursorCondition;
  if (baseWhere.AND) {
    return { AND: [cursorCondition, ...(Array.isArray(baseWhere.AND) ? baseWhere.AND : [baseWhere.AND])] };
  }
  if (baseWhere.OR) {
    return { AND: [cursorCondition, { OR: baseWhere.OR }] };
  }
  return { AND: [cursorCondition, baseWhere] };
};
