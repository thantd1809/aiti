"use client";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/react";
import { FaCircleUser } from "react-icons/fa6";
import { Button, Icon } from "@chakra-ui/react";
import { useUser } from "../utils/UserContext";
import { useState } from "react";
import { IoSettingsOutline } from "react-icons/io5";
import { IoIosLogOut } from "react-icons/io";
import { RiAdminLine, RiFileFill } from "react-icons/ri";
import { signOut } from "next-auth/react";
import PopupAccountSetting from "@/src/components/PopupAccountSetting";
import { usePathname } from "next/navigation";
import { DoorOpen, FileUp } from "lucide-react";

export default function Avatar({}) {
  const [isModalAccountSetting, setIsModalAccountSetting] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const [opacity, setOpacity] = useState("1");
  const [loginStatus, setLoginStatus] = useState(true);
  const { user, logout } = useUser();

  const handleLogout = async () => {
    if (!user) return;
    await signOut({ redirect: false });
    logout();
    setSpinner(true);
    setOpacity("0.5");
    localStorage.setItem("loginStatus", "false");
    window.location.href = "/login";
  };

  const accountSetting = () => {
    setIsModalAccountSetting(true);
  };

  const adminPage = () => {
    if (!user) return;
    setSpinner(true);
    setOpacity("0.5");
    window.location.href = "/user";
  };

  const departPage = () => {
    if (!user) return;
    setSpinner(true);
    setOpacity("0.5");
    window.location.href = "/department";
  };

  const uploadPage = () => {
    if (!user) return;
    setSpinner(true);
    setOpacity("0.5");
    window.location.href = "/upload-new";
  };

  const getStatePopup = (childData: boolean) => {
    // setStatePopup(childData)
    setIsModalAccountSetting(childData);
  };

  return (
    <>
      {user && (
        <div className="dropdown">
          <Dropdown>
            <DropdownTrigger className="dropdownBtn">
              <Button variant="solid" background="white">
                <p style={{ color: "black" }}>
                  {user.name !== "" ? user.name : user.email.split("@")[0]}
                </p>
                <span style={{ marginLeft: "5px" }}>
                  <Icon style={{ color: "black" }} as={FaCircleUser} />
                </span>
              </Button>
            </DropdownTrigger>
            {user.role === 1 && (
              <DropdownMenu>
                <DropdownItem onClick={accountSetting}>
                  <span className="iconMenu">
                    <Icon as={IoSettingsOutline} />
                  </span>
                  Account setting
                </DropdownItem>
                <DropdownItem onClick={adminPage}>
                  <span className="iconMenu">
                    <Icon as={RiAdminLine} />
                  </span>
                  User management
                </DropdownItem>
                <DropdownItem onClick={departPage}>
                  <span className="iconMenu">
                    <Icon as={DoorOpen} />
                  </span>
                  Depart Document
                </DropdownItem>
                <DropdownItem onClick={uploadPage}>
                  <span className="iconMenu">
                    <Icon as={FileUp} />
                  </span>
                  Upload Document
                </DropdownItem>
                <DropdownItem onClick={handleLogout}>
                  <span className="iconMenu">
                    <Icon as={IoIosLogOut} />
                  </span>
                  Logout
                </DropdownItem>
              </DropdownMenu>
            )}
            {user.role === 2 && (
              <DropdownMenu>
                <DropdownItem onClick={accountSetting}>
                  <span className="iconMenu">
                    <Icon as={IoSettingsOutline} />
                  </span>
                  Account setting
                </DropdownItem>
                <DropdownItem onClick={uploadPage}>
                  <span className="iconMenu">
                    <Icon as={FileUp} />
                  </span>
                  Upload file page
                </DropdownItem>
                <DropdownItem onClick={handleLogout}>
                  <span className="iconMenu">
                    <Icon as={IoIosLogOut} />
                  </span>
                  Logout
                </DropdownItem>
              </DropdownMenu>
            )}
          </Dropdown>
          {isModalAccountSetting == true && (
            <PopupAccountSetting
              statePopup={getStatePopup}
            ></PopupAccountSetting>
          )}
        </div>
      )}
    </>
  );
}
