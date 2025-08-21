import {
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Button,
  Modal,
} from "@nextui-org/react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ModalSession({ open }) {
  const router = useRouter();
  const handleLogin = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };
  return (
    <>
      <Modal isOpen={open}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="text-black" style={{ marginTop: "25px" }}>
                Info
              </ModalHeader>
              <ModalBody>
                <p>Please login again</p>
              </ModalBody>
              <ModalFooter>
                <Button className="btnPopup" onClick={handleLogin}>
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
