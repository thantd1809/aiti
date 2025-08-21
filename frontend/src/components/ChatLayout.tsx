"use client";
import Footer from "@/src/components/Footer";
import ListHistory from "@/src/components/ListHistory";
import { signOut } from "next-auth/react";
import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import { ChakraProvider } from "@chakra-ui/react";
import Image from "next/image";
import logo_istech from "../../public/images/custom_logo.png";
import { Spinner } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import PopupAccountSetting from "@/src/components/PopupAccountSetting";
import { useUser } from "@/src/utils/UserContext";
import Avatar from "@/src/components/Avatar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isModalAccountSetting, setIsModalAccountSetting] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const [opacity, setOpacity] = useState("1");

  const getStatePopup = (childData: boolean) => {
    // setStatePopup(childData)
    setIsModalAccountSetting(childData);
  };

  const [openList, setOpenList] = useState(true);
  const openListHistory = () => {
    setOpenList(!openList);
  };
  return (
    <>
      <div
        className="relative flex flex-row justify-start overflow-hidden"
        style={{ opacity: opacity }}
      >
        <div
          className={`transition-all duration-500 ease-in-out ${
            openList ? "w-full md:w-2/5" : "w-0"
          }`}
          style={{
            opacity: openList ? 1 : 0,
          }}
        >
          <ListHistory openList={openList} setOpenList={setOpenList} />
        </div>

        <div className={`flex-1 text-white h-screen ${openList ? "w-0" : ""}`}>
          <div
            style={{
              width: "100%",
              height: "80px",
              boxShadow: "0px 1px 5px #888888",
              border: "1px solid",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 5px",
              background: "#fff",
            }}
          >
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-align-justify-icon lucide-align-justify"
                onClick={openListHistory}
              >
                <path d="M3 12h18" />
                <path d="M3 18h18" />
                <path d="M3 6h18" />
              </svg>
            </div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginLeft: "40px",
                }}
              >
                <Image src={logo_istech} alt="picture" width={80} height={80} />
                <p
                  style={{ color: "#aaa", fontSize: "12px", marginTop: "5px" }}
                >
                  AI Assistant
                </p>
              </div>
            </div>
            <Avatar />
          </div>

          {isModalAccountSetting == true && (
            <PopupAccountSetting
              statePopup={getStatePopup}
            ></PopupAccountSetting>
          )}

          <ChakraProvider>
            <ToastContainer />
            {children}
          </ChakraProvider>
        </div>
      </div>

      {spinner && (
        <div style={{ position: "absolute", top: "36%", left: "49%" }}>
          <Spinner size="lg" />
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0">
        <Footer />
      </div>
    </>
  );
}
