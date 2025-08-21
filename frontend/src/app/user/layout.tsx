"use client";
import Sidebar from "@/src/components/SideBar";
import { Spinner } from "@nextui-org/react";
import React, { useState } from "react";
export default function Layout({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(false);
  const [opacity, setOpacity] = useState("1");
  const getState = (childData: boolean) => {
    setState(childData);
    setOpacity("0.5");
  };
  return (
    <>
      <div
        className=" h-screen flex flex-row justify-start"
        style={{ opacity: opacity }}
      >
        <div className="sm:block hidden">
          <Sidebar stateChild={getState} />
        </div>

        <div className=" flex-1 text-white overflow-hidden">{children}</div>
      </div>
      {state == true && (
        <div style={{ position: "absolute", top: "36%", left: "49%" }}>
          <div>
            <Spinner size="lg" />
          </div>
        </div>
      )}
    </>
  );
}
