"use client";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function PopupSession(props: {
  openPopup: any;
  stateOpenPopup: any;
}) {
  const router = useRouter();
  const handleLogout = async () => {
    await signOut({ redirect: false });
    localStorage.setItem("loginStatus", "false");
    router.replace("/login");
    props.stateOpenPopup(false);
  };

  return (
    <>
      <Modal isOpen={props.openPopup}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="text-black" style={{ marginTop: "25px" }}>
                Session Timeout
              </ModalHeader>
              <ModalBody>
                <p>Your session has timed out. Please log in again.</p>
              </ModalBody>
              <ModalFooter>
                <Button className="btnPopup" onClick={handleLogout}>
                  OK
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
