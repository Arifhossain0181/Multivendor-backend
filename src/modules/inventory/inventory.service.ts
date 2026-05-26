

export const batchFetchStock = async (variantIds: string[]) => {
    return await prisma.productVariant.findMany({
        where:{
            id:{
                in:variantIds
            }
        },
        select:{
            id:true,
            sku:true,
            availableQty:true,
                product:true
        }
    })
}
export const atomicDeduct = async(tx:any,variantId:string,quantity:number) => {
    const variant = await tx.productVariant.findUnique({
        where:{id:variantId},
        availableQty:{
            gte:quantity
        }
    },
    data:{
        availableQty:{
            decrement:quantity
        }
    }
)
if(updated.count === 0){
    throw new Error(`Failed to deduct stock for variant ${variantId}. Insufficient quantity or variant not found.`);
}
}

export const restoreStock = async (tx: any, variantId: string, quantity: number) => {
    await tx.productVariant.update({
        where: { id: variantId },
        data: {
            availableQty: {
                increment: quantity // অ্যাটমিকালি স্টক বাড়িয়ে দেওয়া হচ্ছে
            }
        }
    });
};