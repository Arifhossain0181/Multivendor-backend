import { prisma } from "../../prisma/client";

export const getCartWithItems = async (userId: string) => {
  let cart = await prisma.cart.findUnique({
    where: {
      customerId: userId,
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              imageUrls: true,
              sellerId: true,
              seller: {
                select: {
                  shopName: true,
                },
              },
            },
          },
          variant: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              inventory: {
                select: {
                  availableQty: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        customerId: userId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrls: true,
                sellerId: true,
                seller: {
                  select: {
                    shopName: true,
                  },
                },
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                inventory: {
                  select: {
                    availableQty: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
  return cart;
};

export const addItem = async (
  userId: string,
  productId: string,
  variantId: string,
  quantity: number,
) => {
  // Validate the variant exists and belongs to the product
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: {
      product: true,
      inventory: true,
    },
  });
  if (!variant || variant.product.id !== productId) {
    throw new Error("Product variant not found or does not belong to the specified product");
  }

  // Check stock if inventory exists
  if (variant.inventory && variant.inventory.availableQty < quantity) {
    throw new Error("Insufficient stock to add the item to cart");
  }

  // Get or create cart for this user
  let cart = await prisma.cart.findUnique({ where: { customerId: userId } });

  if (!cart) {
    cart = await prisma.cart.create({ data: { customerId: userId } });
  }

  const cartId = cart.id;

  // Check if the item with the same variant already exists in the cart
  const existingCartItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId_variantId: { cartId, productId, variantId },
    },
  });

  if (existingCartItem) {
    const newQuantity = existingCartItem.quantity + quantity;
    if (variant.inventory && variant.inventory.availableQty < newQuantity) {
      throw new Error("Insufficient stock to update the cart item quantity");
    }

    return await prisma.cartItem.update({
      where: { id: existingCartItem.id },
      data: { quantity: newQuantity },
    });
  }

  return await prisma.cartItem.create({
    data: {
      cartId,
      productId,
      variantId,
      sellerId: variant.product.sellerId,
      quantity,
    },
  });
};

// Remove Item From Cart
export const removeItem = async (userId: string, cartItemId: string) => {
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: true },
  });

  if (!cartItem || cartItem.cart.customerId !== userId) {
    throw new Error("Cart item not found or does not belong to the user");
  }

  return await prisma.cartItem.delete({
    where: { id: cartItemId },
  });
};

export const clearCart = async (userId: string) => {
  const cart = await prisma.cart.findUnique({ where: { customerId: userId } });
  if (!cart) return;

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });
};

