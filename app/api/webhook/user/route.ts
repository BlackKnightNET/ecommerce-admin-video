import prismadb from "@/lib/prismadb";
import { IncomingHttpHeaders } from "http";
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import {headers}from "next/headers";
import {Webhook, WebhookRequiredHeaders}from "svix"

const webhookSecret=process.env.WEBHOOK_SECRET ||"";
async function handler (request:Request){
const payload=await request.json();
const headersList=headers();
const heads={
    "svix-id": headersList.get("svix-id"),
    "svix-timestamp": headersList.get("svix-timestamp"),
    "svix-signature": headersList.get("svix-signature"),
}
const wh =new Webhook(webhookSecret)
let evt:Event|null=null;
try {
    evt =wh.verify(JSON.stringify(payload),
    heads as IncomingHttpHeaders & WebhookRequiredHeaders
    )as Event;
} catch (error) {
    console.error((error as Error).message)

    return NextResponse.json({},{status:400})
}
const eventType: EventType=evt.type;
if (eventType==="user.created"|| eventType === "user.updated"){
    const {id, ...attributes}=evt.data;
    
    await prismadb.user.upsert({ 
        where:{externalId:id as string},
        create:{
            externalId: id as string,
            attributes
        },
        update:{attributes}
    })
}
return NextResponse.json({ success: true });  //added this one 
}

type EventType="user.created"|"user.updated"|"#";
type Event={
    data:Record<string, string|number>,
    object:"event",
    type:EventType,
}
export const GET=handler;
export const POST=handler;
export const PUT=handler;