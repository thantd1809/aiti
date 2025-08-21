"user client";
import { Button, Icon } from "@chakra-ui/react";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/react";
import { IoSettingsOutline } from "react-icons/io5";
import { BsChatRightText } from "react-icons/bs";
import { IoIosLogOut } from "react-icons/io";
import { FaCircleUser } from "react-icons/fa6";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useUser } from "../utils/UserContext";

export default function Header() {
  const { user } = useUser();
  const router = useRouter();
  const handleLogin = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };
  const handleSetting = async () => {
    router.push("/upload");
  };
  const handleChat = async () => {
    router.push("/chat");
  };
  return (
    <div style={{ width: "100%", height: "90px", background: "#FFFFFF" }}>
      <header style={{}}>
        <div className="dropdownHeader">
          <Dropdown>
            <DropdownTrigger className="dropdownBtn">
              <Button variant="solid" color="#000000">
                <p style={{ color: "black" }}>{user.name}</p>
                <span style={{ marginLeft: "5px" }}>
                  <Icon as={FaCircleUser} />
                </span>
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem className="text-black" onClick={handleSetting}>
                <span className="iconMenu">
                  <Icon as={IoSettingsOutline} />
                </span>
                Account setting
              </DropdownItem>
              <DropdownItem className="text-black" onClick={handleChat}>
                <span className="iconMenu">
                  <Icon as={BsChatRightText} />
                </span>
                Go to chat screen
              </DropdownItem>
              <DropdownItem className="text-black" onClick={handleLogin}>
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
  );
}
