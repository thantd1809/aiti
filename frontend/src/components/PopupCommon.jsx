import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PopupCommon({
  header,
  content,
  textButton,
  link,
  handle,
}) {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const router = useRouter();
  const closeModal = () => {
    setIsModalOpen(false);
    router.push(`${link}`);
  };
  const handleButton = () => {
    handle;
  };
  return (
    <div>
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-black" style={{ marginTop: "25px" }}>
                {header}
              </ModalHeader>
              <ModalBody>
                <p>{content}</p>
              </ModalBody>
              <ModalFooter>
                <Button className="btnPopup" onPress={handleButton}>
                  {textButton}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
