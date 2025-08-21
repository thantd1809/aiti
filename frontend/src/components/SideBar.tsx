"use client";
import classNames from "classnames";
import React, { useState } from "react";
import { BsFiles } from "react-icons/bs";
import { FiUsers } from "react-icons/fi";
import sprite_logo from "../../public/images/sprite-logo.png";
import Image from "next/image";
import { RxTrackPrevious } from "react-icons/rx";
import { Icon } from "@chakra-ui/react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/src/utils/UserContext";

const menuItems = [
  { id: 1, label: "User Management ", icon: FiUsers, link: "/user" },
  { id: 2, label: "File Management ", icon: BsFiles, link: "/upload" },
];

const Sidebar = (props: { stateChild: any }) => {
  const { user } = useUser();
  const [toggleCollapse, setToggleCollapse] = useState(true);
  const [isCollapsible, setIsCollapsible] = useState(true);
  const router = useRouter();
  const pathName = usePathname();
  const wrapperClasses = classNames(
    "h-screen px-4 pt-[1rem] pb-4 bg-light flex justify-between flex-col",
    {
      ["w-[20%]"]: !toggleCollapse,
      ["w-0"]: toggleCollapse,
    },
  );

  const collapseIconClasses = classNames(
    "absolute top-1/3 w-6 h-6  justify-center items-center cursor-pointer",
    {
      "rotate-180": toggleCollapse,
    },
  );
  const getState = () => {
    props.stateChild(true);
  };

  const handleSidebarToggle = () => {
    setToggleCollapse(!toggleCollapse);
  };

  return user && user.role === 1 ? (
    <div className={wrapperClasses} style={{ background: "#343A40" }}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between relative h-1/10">
          <div className="flex items-center pl-1 gap-4  w-full  ">
            {/* <LogoIcon /> */}

            <span
              className={classNames(
                "mt-2 text-lg font-medium text-text border-b-[1px] pb-[3%] w-full ",
                {
                  hidden: toggleCollapse,
                },
              )}
            >
              {/* <div className="border-b-[1px]"> */}
              <div style={{}}>
                <Image
                  src={sprite_logo}
                  alt=""
                  className="mr-auto ml-auto block"
                />
              </div>
            </span>
          </div>
          {isCollapsible && (
            <button
              className={collapseIconClasses}
              style={{ top: "345px", right: "-15px" }}
              onClick={handleSidebarToggle}
            >
              <Icon as={RxTrackPrevious} />
            </button>
          )}
        </div>
        <div className="flex flex-col items-start mt-10">
          {!toggleCollapse && (
            <>
              {menuItems.map((item: any) => {
                if (pathName == item.link) {
                  return (
                    <button
                      key={item.id}
                      id="sidebarBtn"
                      className="flex py-4 px-3 items-center w-full my-4 "
                      onClick={() => {
                        router.push(`${item.link}`), getState();
                      }}
                    >
                      <Icon as={item.icon} />
                      <span
                        className={classNames(
                          "text-md font-medium text-text-light ml-2 ",
                        )}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                } else {
                  return (
                    <button
                      key={item.id}
                      className="flex py-4 px-3 items-center w-full my-4 "
                      onClick={() => {
                        router.push(`${item.link}`), getState();
                      }}
                    >
                      <Icon as={item.icon} />
                      <span
                        className={classNames(
                          "text-md font-medium text-text-light ml-2 ",
                        )}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                }
              })}
            </>
          )}
        </div>
      </div>
    </div>
  ) : null;
};

export default Sidebar;
