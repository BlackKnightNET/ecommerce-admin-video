import {auth} from "@clerk/nextjs"
import { redirect } from "next/navigation";
import prismadb from "@/lib/prismadb"
import { SettingsForm } from "./components/settings-form";
import BackupButton from "@/components/database-buttons/BackupButton";
import UploadButton from "@/components/database-buttons/UploadButton";

interface settingsPageProps{
    params:{
        storeId:string;
    }
}

const SettingsPage:React.FC<settingsPageProps> = async({
params

})=>{
    const{userId}=auth();
    if (!userId){
        redirect("/sign-in")
    }
    const store = await  prismadb.store.findFirst({
        where:{
            id: params.storeId,
            userId

        }
    })

    if (!store){
        redirect("/");
    }
    return(
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <SettingsForm initialData={store} />
            </div>
        <BackupButton/>
        <UploadButton/>
        </div>
    );
};

export default  SettingsPage;