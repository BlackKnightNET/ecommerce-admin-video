import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";

import prismadb from "@/lib/prismadb";

export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    if (!params.productId) {
      return new NextResponse("Product id is required", { status: 400 });
    }

    const product = await prismadb.product.findUnique({
      where: {
        id: params.productId
      },
      include: {
        images: true,
        category: true,
        subcategory: true,
        subsub: true,
        sizes: {
          include: {
            size: true
          }
        },
        colors: {
          include: {
            color: true
          }
        },
      }
    });
  console.log(product)
    return NextResponse.json(product);
  } catch (error) {
    console.log('[PRODUCT_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
};

export async function DELETE(
  req: Request,
  { params }: { params: { productId: string, storeId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 403 });
    }

    if (!params.productId) {
      return new NextResponse("Product id is required", { status: 400 });
    }

    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeId,
        userId
      }
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 405 });
    }

    const product = await prismadb.product.delete({
      where: {
        id: params.productId
      },
    });
  
    return NextResponse.json(product);
  } catch (error) {
    console.log('[PRODUCT_DELETE]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
};


export async function PATCH(
  req: Request,
  { params }: { params: { productId: string, storeId: string } }
) {
  try {
    const { userId } = auth();

    const body = await req.json();

    const { name, description,info,quantity, price, categoryId, subcategoryId,subsubId, images, colors, sizes, isFeatured, isArchived, isOffered, isUndercost} = body;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 403 });
    }

    if (!params.productId) {
      return new NextResponse("Product id is required", { status: 400 });
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }
    if (!description) {
      return new NextResponse("Description is required", { status: 400 });
    }
    if (!info) {
      return new NextResponse("Info is required", { status: 400 });
    }
    if (!images || !images.length) {
      return new NextResponse("Images are required", { status: 400 });
    }
    if (!quantity) {
      return new NextResponse("Price is required", { status: 400 });
    }

    if (!price) {
      return new NextResponse("Price is required", { status: 400 });
    }
 
    if (!categoryId) {
      return new NextResponse("Category id is required", { status: 400 });
    }
    if (!subcategoryId) {
      return new NextResponse("Subcategory id is required", { status: 400 });
    }
    if (!subsubId) {
      return new NextResponse("Subsub id is required", { status: 400 });
    }
    if (!colors ) {
      return new NextResponse("Color id is required", { status: 400 });
    }

    if (!sizes) {
      return new NextResponse("Size id is required", { status: 400 });
    }

    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeId,
        userId
      }
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 405 });
    }

    await prismadb.product.update({
      where: {
        id: params.productId
      },
      data: {
        name,
        description,
        info,
        quantity,
        price,
        categoryId,
        subcategoryId,
        subsubId,
        colors: {
          deleteMany: {},
        },
        sizes: {
          deleteMany: {},
        },
        images: {
          deleteMany: {},
        },
        isFeatured,
        isArchived,
        isOffered,
        isUndercost
      },
    });

    const product = await prismadb.product.update({
      where: {
        id: params.productId
      },
      data: {
        colors: {
          createMany: {
            data: [
              ...colors.map((color: string) => ({colorId: color})),
            ],
          },
        },
        sizes: {
          createMany: {
            data: [
              ...sizes.map((size: string) => ({sizeId: size})),
            ]
          },
        },
        images: {
          createMany: {
            data: [
              ...images.map((image: { url: string }) => image),
            ],
          },
        },
      },
    })
  
    return NextResponse.json(product);
  } catch (error) {
    console.log('[PRODUCT_PATCH]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
};


