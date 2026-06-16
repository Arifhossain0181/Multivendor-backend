import { prisma } from '../../prisma/client';
import { ApiError } from '../../utlits/ApiError.js';

export const updateSellerStatus = async (sellerProfileId: string, status: 'APPROVED' | 'REJECTED') => {
    const profile = await prisma.sellerProfile.findUnique({ where: { id: sellerProfileId } });
    if (!profile) throw ApiError.notFound('Seller profile not found');
return await prisma.$transaction(async (tx: any) => {
        // 1. Update seller profile status
        const updatedProfile = await tx.sellerProfile.update({
            where: { id: sellerProfileId },
            data: { status }
        });

        // 2 if approved, then update user role to SELLER
        if (status === 'APPROVED') {
            await tx.user.update({
                where: { id: profile.userId },
                data: { role: 'SELLER' }
            });
        }

        return updatedProfile;
    });
}
