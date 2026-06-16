import { title } from "node:process";
import { prisma } from "../../prisma/client";
import { ApiError } from "../../utlits/ApiError.js";

export const getCartWithItems = async (userId: string) => {
  let cart = await prisma.cart.findUnique({
    where: {
      userId,
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              title: true,
              price: true,
              sellerId: true,
            },
            varitent: {
              select: {
                sku: true,
                attributes: true,
                availableQty: true,
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
        userId,
      },
      include: {
        items: true,
      },
    });
  }
  return cart;
};

export const addItem = async (
  userID: string,
  productId: string,
  variantId: string,
  quantity: number,
) => {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: {
      product: true,
    },
  });
  if (!variant || variant.product.id !== productId) {
    throw new Error("Product variant not found or does not belong to the specified product 400");
  }
  // Primarry check for stock availability
  if (variant.availableQty < quantity) {
    throw new Error("Insufficient stock to add the item to cart 400");
  }

  // user cart id nwa
  const cart = await prisma.cart.findUnique({ where: { userID } });

  const cartId = cart
    ? cart.id
    : (await prisma.cart.create({ data: { userID } })).id;

  // check if the item with the same variant already exists in the cart
  const existingCartItem = await prisma.cartItem.findFirst({
    where: {
      cartId_variantId: { cartId, productId, variantId },
    },
  });
  if (existingCartItem) {
    const newQuantity = existingCartItem.quantity + quantity;
    if (variant.availableQty < newQuantity) {
      throw new Error("Insufficient stock to update the cart item quantity 400");
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
      quantity,
    },
  });
};

//Remove Item From Cart

export const removeItem = async (userId: string, cartItemId: string) => {
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: true },
  });

  if (!cartItem || cartItem.cart.userId !== userId) {
    throw new Error("Cart item not found or does not belong to the user");
  }

  return await prisma.cartItem.delete({
    where: { id: cartItemId },
  });
};
export const clearCart = async (userId: string) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) return;

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });
};
