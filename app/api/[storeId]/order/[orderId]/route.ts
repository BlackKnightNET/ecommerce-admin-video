import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";

import prismadb from "@/lib/prismadb";


export async function GET(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    if (!params.orderId) {
      return new NextResponse("Order id is required", { status: 400 });
    }

    const order = await prismadb.order.findUnique({
      where: {
        id: params.orderId
      }
    });
  
    return NextResponse.json(order);
  } catch (error) {
    console.log('[ORDER_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
};
export async function DELETE(
  req: Request,
  { params }: { params: { orderId: string, storeId: string } }
) {
  try {

    await prismadb.orderItem.deleteMany({
      where: {
        orderId: params.orderId
      }
    })
    
    console.log(params.orderId)

    const order = await prismadb.order.delete({
      where: {
        id: params.orderId,
      }
    });
  
    return NextResponse.json(order);
  } catch (error) {
    console.log('[ORDER_DELETE]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
};

export async function PATCH(
  req: Request,
  { params }: { params: { orderId: string, storeId: string } }
) {
  try {
    const { userId } = auth();

    const body = await req.json();

    const { tracking,status } = body;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 403 });
    }

    if (!tracking) {
      return new NextResponse("Tracking is required", { status: 400 });
    }

    if (!status) {
      return new NextResponse("Status is required", { status: 400 });
    }


    if (!params.orderId) {
      return new NextResponse("Order id is required", { status: 400 });
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

    const order = await prismadb.order.update({
      where: {
        id: params.orderId
      },
      data: {
        tracking,
        status
      }
    });
  
    return NextResponse.json(order);
  } catch (error) {
    console.log('[ORDER_PATCH]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
};

