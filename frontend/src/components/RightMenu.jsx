"user client";
import { Button, Icon } from "@chakra-ui/react";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/react";
import { IoSettingsOutline } from "react-icons/io5";
import { IoIosLogOut } from "react-icons/io";
import { RiAdminLine } from "react-icons/ri";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaUserCircle } from "react-icons/fa";
import PopupAccountSetting from "./PopupAccountSetting";
import { useUser } from "../utils/UserContext";
import { UserProvider } from "../utils/UserContext";

export default function RightMenu({ stateChild }) {
  const { user, logout } = useUser();
  const router = useRouter();
  const [isModalAccountSetting, setIsModalAccountSetting] = useState(false);
  const getState = () => {
    stateChild(true);
  };
  const accountSetting = () => {
    setIsModalAccountSetting(true);
  };
  const handleLogout = async () => {
    await signOut({ redirect: false });
    getState();
    logout();
    localStorage.setItem("loginStatus", "false")
  };
  const handleChat = () => {
    getState();
    router.push("/chat");
  };
  const getStatePopup = (childData) => {
    setIsModalAccountSetting(childData);
  };
  return (
    <UserProvider>
    <div
    className="sm:w-full w-screen sm:h-[80px] h-[40px] bg-white shadow-md border border-gray-300 text-black">
      <header style={{}}>
        <div className="float-right sm:mt-5 sm:mr-4 mr-2">
          <Dropdown>
            <DropdownTrigger className="dropdownBtn">
              <Button variant="solid" color="#000000">
              <p style={{ color: "black" }}>
                  {user.name !== "" ? user.name : user.email.split("@")[0]}
                </p>
                <span style={{ marginLeft: "5px" }}>
                  <Icon style={{ color: "black" }} as={FaUserCircle} />
                </span>
              </Button>
            </DropdownTrigger>

            <DropdownMenu>
              <DropdownItem className="text-black" onClick={accountSetting}>
                <span className="iconMenu">
                  <Icon as={IoSettingsOutline} />
                </span>
                Account setting
              </DropdownItem>

              <DropdownItem className="text-black" onClick={handleChat}>
                <span className="iconMenu">
                  <Icon as={RiAdminLine} />
                </span>
                Go to chat page
              </DropdownItem>
              <DropdownItem className="text-black" onClick={handleLogout}>
                <span className="iconMenu">
                  <Icon as={IoIosLogOut} />
                </span>
                Logout
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </header>
      {isModalAccountSetting == true && (
        <PopupAccountSetting statePopup={getStatePopup}></PopupAccountSetting>
      )}
    </div>
    </UserProvider>
    
  );
}
