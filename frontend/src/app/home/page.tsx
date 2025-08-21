"use client";

import { ChatWindow } from "../../components/ChatWindow";
import { ToastContainer } from "react-toastify";

import { Button, ChakraProvider, Icon } from "@chakra-ui/react";
import Image from "next/image";
import logo_sprite_black from "../../../public/images/logo-sprite-black.png";
import AI_text_black from "../../../public/images/AI-text-black.png";
import { FaCircleUser } from "react-icons/fa6";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/react";
import { IoSettingsOutline } from "react-icons/io5";
import { BsChatRightText } from "react-icons/bs";
import { IoIosLogOut } from "react-icons/io";

export default function page() {
  return (
    <div>
      <div className="chatScreen">
        <ChakraProvider>
          <ToastContainer />

          <div style={{ width: "100%", height: "110px" }}>
            <header style={{}}>
              <div style={{ background: "#d9ffb3", marginLeft: "auto" }}>
                <Image
                  src={logo_sprite_black}
                  alt="picture"
                  width={200}
                  height={200}
                  style={{ marginLeft: "35px" }}
                />
                <Image
                  src={AI_text_black}
                  alt="picture"
                  width={85}
                  height={90}
                  style={{ marginLeft: "90px" }}
                />
              </div>
              <div className="dropdown">
                <Dropdown>
                  <DropdownTrigger className="dropdownBtn">
                    <Button variant="solid" background="#EFEFEE">
                      User name
                      <span style={{ marginLeft: "5px" }}>
                        <Icon as={FaCircleUser} />
                      </span>
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    <DropdownItem href="/filemanagement">
                      <span className="iconMenu">
                        <Icon as={IoSettingsOutline} />
                      </span>
                      Account setting
                    </DropdownItem>
                    <DropdownItem href="/">
                      <span className="iconMenu">
                        <Icon as={BsChatRightText} />
                      </span>
                      Go to chat screen
                    </DropdownItem>
                    <DropdownItem href="/">
                      <span className="iconMenu">
                        <Icon as={IoIosLogOut} />
                      </span>
                      Logout
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </header>
          </div>
          <ChatWindow
            titleText="In-house AI concierge service demo"
            placeholder="Please ask me anything!"
          ></ChatWindow>
        </ChakraProvider>
      </div>
    </div>
  );
}
