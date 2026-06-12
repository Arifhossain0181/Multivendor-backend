
export const createSellerProfile= async(
    userId: string,
    storeName: string,
    description: string
) => {

    try{
        const existingSeller = await prisma.seller.findUnique({ where: { userId } });
        if (existingSeller) {
            throw ApiError(400, "Seller profile already exists for this user");
        }
        return await prisma.seller.create({
            data: {
                userId,
                storeName,
                description,
                status: "PENDING",
            },
        });
    }
    catch(error){
        console.error("Error creating seller profile:", error);
        throw ApiError(500, "An error occurred while creating the seller profile");
    }
}

export const findById =async (userId: string) => {
    try {
        const seller = await prisma.seller.findUnique({ where: { userId } ,
            include:{
                user:{
                    select:{
                        name:true,
                        email:true,
                    }
                }
            }
        
        });
        if (!seller) {
            throw ApiError(404, "Seller profile not found");
        }
        return seller;
    }
    catch(error){
        console.error("Error fetching seller profile:", error);
        throw ApiError(500, "An error occurred while fetching the seller profile");
    }
}

export const transitionSubOrder = async (subOrderId :string,sellerId:string,nextStatus:string) => {

   try{
    const subOrder = await prisma.subOrder.findUnique({ where: { id: subOrderId } ,
    include:{
        masterOrder:true
    }});
    if(!subOrder){
        throw ApiError(404,"Sub-order not found");
    }
    //owner shiP check
    if(subOrder.sellerId !== sellerId){
        throw ApiError(403,"You are not authorized to update this sub-order");
    }

    // master order Paid nh hole fullfulment block thakbe

    if(subOrder.masterOrder.status !== "PAID"){
        throw ApiError(400,"Master order is not paid yet. Cannot update sub-order status.");
    }
    // PRD FSM Flow: PENDING → CONFIRMED → SHIPPED → DELIVERED
    const currentStatus = subOrder.status;
    const isValidTransition = 
        (currentStatus === 'PENDING' && nextStatus === 'CONFIRMED') ||
        (currentStatus === 'CONFIRMED' && nextStatus === 'SHIPPED') ||
        (currentStatus === 'SHIPPED' && nextStatus === 'DELIVERED');

    if (!isValidTransition) {
        throw new ApiError(400, `Invalid status transition from ${currentStatus} to ${nextStatus}`);
    }
    return await prisma.subOrder.update({
        where: { id: subOrderId },
        data: { status: nextStatus },
    })
   }
    catch(error){
        console.error("Error updating sub-order status:", error);
        if (error instanceof ApiError) {
            throw error; // Re-throw known API errors
        }
    }
}