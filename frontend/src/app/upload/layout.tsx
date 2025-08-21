"use client";

import Sidebar from "@/src/components/SideBar";
import { Spinner } from "@nextui-org/react";
import React, { useState } from "react";
import { UserProvider } from "@/src/utils/UserContext";
export default function Layout({ children }: { children: React.ReactNode }) {
  const [opacity, setOpacity] = useState("1");
  const [spinner, setSpinner] = useState(false);

  const getState = (childData: boolean) => {
    setSpinner(childData);
    setOpacity("0.5");
  };
  return (
    <>
      <UserProvider>
        <div
          className=" h-screen flex flex-row justify-start"
          style={{ opacity: opacity }}
        >
          <Sidebar stateChild={getState} />
          <div className=" flex-1 ">{children}</div>
        </div>
        <div className="spinner">
          {spinner == true && (
            <div>
              <Spinner size="lg" />
            </div>
          )}
        </div>
      </UserProvider>
    </>
  );
}
