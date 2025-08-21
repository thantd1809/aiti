"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@nextui-org/react";
import { useUser } from "../utils/UserContext";

export default function Home() {
  const router = useRouter();
  const { user } = useUser();
  useEffect(() => {
    if (!user || user.pwd_status === false) {
      localStorage.setItem("loginStatus", "false");
      console.log("login");

      router.push("/login");
    } else {
      console.log("chaat");
      router.push("/chat");
    }
  }, [user]);
  return (
    <>
      <Spinner className="absolute top-[50%] left-[50%]"></Spinner>
    </>
  );
}
