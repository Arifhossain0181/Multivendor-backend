import { prisma } from "../../prisma/client.js";
import { ApiError } from "../../utlits/ApiError.js";

export const findById = async (userId:string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        throw new ApiError(404,'', "User not found");
    }

    return user;
};

export const updateProfile = async (
    userId: string,
    data: { name?: string; email?: string }
) => {
    if (data.email) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
            select: { id: true },
        });

        if (existingUser && existingUser.id !== userId) {
            throw new ApiError(400, '',"Email already in use");
        }
    }

    return await prisma.user.update({
        where: { id: userId },
        data,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    });
};