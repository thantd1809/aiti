'use client';

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import PopupSession from "./PopupSession";
import { usePathname, useRouter } from "next/navigation";

export default function AutoShowSessionTimeOut() {
    const [isPopupSession, setIsPopupSession] = useState(false)
    const { data: session, status } = useSession();    
    const router = useRouter();
    const patthName = usePathname()
    const listPath = ['chat','user','upload','initial-password']
    const getStatePopup = (stateData: boolean) => {
        setIsPopupSession(stateData)
      };
    useEffect(() => {
        let id = patthName.split("/")        
        //Get the value from local storage if it exists
        let loginStatus = localStorage.getItem("loginStatus") || ""
        if (loginStatus == "true" && status == "unauthenticated") {          
            setIsPopupSession(true)
        }
        else if (loginStatus == 'false' && status == 'unauthenticated' && listPath.includes(id[1]) == true){
            router.push('/login')
        } 
    }, [session])


    return (
        <>
           <PopupSession openPopup={isPopupSession} stateOpenPopup={getStatePopup}/>
        </>
    );
}
