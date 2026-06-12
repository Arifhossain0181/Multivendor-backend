

export const findById= async (userId:string) =>{
    const user = await prisma.user.findUnique({
        where:{
            id:userId
        },
        select:{
            id:true,
            name:true,
            email:true,
            role:true,
            createdAt:true,
            updatedAt:true
        }
    })
    if(!user){
        throw ApiError(404,'User not found');}
    return user;

}

export const updateProfile = async (userId: string, data: { name?: string; email?: string }) => {
    if (data.email) {
        // High-speed unique constraint check before triggering update write-lock
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
            select: { id: true }
        });
        
        if (existingUser && existingUser.id !== userId) {
            throw new ApiError(400, 'Email is already taken by another account');
        }
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    });

    return updatedUser;
};