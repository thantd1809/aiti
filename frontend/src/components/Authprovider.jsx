"use client";
import React from "react";
import { SessionProvider } from "next-auth/react";
import AutoShowSessionTimeOut from "./AutoShowSessionTimeOut";
import { usePathname } from "next/navigation";

const Authprovider = ({ children }) => {
  const currentPath = usePathname()
  return <SessionProvider>
    <AutoShowSessionTimeOut />
    {children}
  </SessionProvider>;

};

export default Authprovider;
