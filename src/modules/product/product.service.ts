

export const createProductBySeller = async(
    sellerId:string,
    productData: {
        title: string;
        description: string;
        price: number;
        category: string;
        variants?: Array<{
            sku: string; attributes: any; availableQty: number
        }>;

    }
)=>{
    
        const categoryExists = await prisma.category.findUnique({
        where: { id: productData.categoryId },
    });
    if (!categoryExists) {
        throw new ApiError(404, 'Category not found');
    }
    //data base transaction (with PRoduct + variants + inventory)
    return await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
            data:{
                ...productData,
                sellerId,
                status:"DRAFT"
            }
        })
        //varient and inventory builk create
        const variantData = variant.map((v) => ({
            productId: product.id,
            sku: v.sku,
            attributes: v.attributes,
            availableQty: v.availableQty,
        }))
        await tx.variant.createMany({
            data: variantData
        })
        return product;
    })
    }
