import Stripe from "stripe";
import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import prismadb from "@/lib/prismadb";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  const { productIds,clientUserId } = await req.json();

  if (!productIds || productIds.length === 0) {
    return new NextResponse("Product ids are required", { status: 400 });
  }

  const products = await prismadb.product.findMany({
    where: {
      id: {
        in: productIds
      }
    }
  });

 

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  const deliveryCost = 300;
  products.forEach((product) => {
    line_items.push({
        quantity: product.quantity, // Use the quantity from the product object
        price_data: {
            currency: 'ALL',
            product_data: {
                name: product.name,
            },
            unit_amount: ( product.price.toNumber() * 100 ) * product.quantity
        }
    });
});
  
  const totalPrice = line_items.reduce((total, item) => {
    const unitAmount = item.price_data?.unit_amount;
    return total + (unitAmount !== undefined ? unitAmount : 0);
  }, 0) / 100;

  const adjustedDeliveryCost = totalPrice > 3999 ? 0 : deliveryCost;
  
  line_items.push({
    quantity: 1,
    price_data: {
      currency: 'ALL',
      product_data: {
        name: 'Delivery Cost',
      },
      unit_amount: adjustedDeliveryCost * 100,
    },
  });
  
 

  const order = await prismadb.order.create({
    data: {
      storeId: params.storeId,
      isPaid: false,
      orderItems: {
        create: productIds.map((productId: string) => ({
          product: {
            connect: {
              id: productId
            }
          }
        }))
      }
    }
  });

  const session = await stripe.checkout.sessions.create({
    line_items,
    mode: 'payment',
    billing_address_collection: 'required',
    phone_number_collection: {
      enabled: true,
    },
    success_url: `${process.env.FRONTEND_STORE_URL}/cart?success=1`,
    cancel_url: `${process.env.FRONTEND_STORE_URL}/cart?canceled=1`,
    metadata: {
      orderId: order.id
    },
  });

  return NextResponse.json({ url: session.url }, {
    headers: corsHeaders
  });
};