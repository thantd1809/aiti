"use client";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@nextui-org/react";
import { useState } from "react";
import AccountSettingTabs from "./AccountSettingTabs";

export default function PopupAccountSetting(props: { statePopup: any }) {
  const [isModalAccountSetting, setIsModalAccountSetting] = useState(true);
  const closeModal = () => {
    setIsModalAccountSetting(false);
    props.statePopup(false);
  };
  return (
    <>
      <Modal
        isOpen={isModalAccountSetting}
        backdrop="blur"
        onClose={closeModal}
        size="2xl"
        classNames={{
          closeButton: "flex justify-end items-center",
          wrapper: "flex justify-center items-center",
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="text-black" style={{ marginTop: "25px" }}>
                Account settings
              </ModalHeader>
              <ModalBody>
                <AccountSettingTabs />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
