import { useEffect, useState } from "react";
import { getAllFileFolder } from "../utils/ApiService";
import { useUser } from "@/src/utils/UserContext";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";

type FileOrFolder = {
  id: string;
  name: string;
};

export default function PopupListFileFolder({
  isOpen,
  onClose,
  onConfirm,
  initialSelectedFileIds,
  initialSelectedFolderIds,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (files: FileOrFolder[], folders: FileOrFolder[]) => void;
  initialSelectedFileIds: string[];
  initialSelectedFolderIds: string[];
}) {
  const [listFile, setListFile] = useState<FileOrFolder[]>([]);
  const [listFolder, setListFolder] = useState<FileOrFolder[]>([]);

  const [localSelectedFiles, setLocalSelectedFiles] = useState<string[]>([]);
  const [localSelectedFolders, setLocalSelectedFolders] = useState<string[]>(
    [],
  );

  const { user } = useUser();

  useEffect(() => {
    if (isOpen) {
      setLocalSelectedFiles(initialSelectedFileIds);
      setLocalSelectedFolders(initialSelectedFolderIds);
    }
  }, [isOpen, initialSelectedFileIds, initialSelectedFolderIds]);

  useEffect(() => {
    if (user) {
      fetchAllFileFolder();
    }
  }, [user]);

  const fetchAllFileFolder = async () => {
    try {
      if (user) {
        const response = await getAllFileFolder();
        if (response.status == 200) {
          setListFile(response.data.data.files);
          setListFolder(response.data.data.folders);
        }
      }
    } catch (error) {
      alert(error);
    }
  };

  const handleSelectFile = (id: string) => {
    setLocalSelectedFiles((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSelectFolder = (id: string) => {
    setLocalSelectedFolders((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleConfirmClick = () => {
    const filesToConfirm = listFile.filter((file) =>
      localSelectedFiles.includes(file.id),
    );
    const foldersToConfirm = listFolder.filter((folder) =>
      localSelectedFolders.includes(folder.id),
    );
    onConfirm(filesToConfirm, foldersToConfirm);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="text-black mt-1 justify-center">
              Choose Files / Folders
            </ModalHeader>
            <ModalBody className="px-1">
              <div className="flex gap-2 h-80">
                {/* File Section */}
                <div className="w-1/2">
                  <h3>Files</h3>
                  <div className="h-[92%] list_chat_container text-black px-4">
                    {listFile.length > 0 ? (
                      listFile.map((file) => (
                        <label
                          key={file.id}
                          className="flex items-center gap-2 py-1 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={localSelectedFiles.includes(file.id)}
                            onChange={() => handleSelectFile(file.id)}
                          />
                          <span className="text-sm">{file.name}</span>
                        </label>
                      ))
                    ) : (
                      <p>No files available</p>
                    )}
                  </div>
                </div>

                {/* Folders Section */}
                <div className="w-1/2">
                  <h3>Folders</h3>
                  <div className="h-[92%] list_chat_container text-black px-4">
                    {listFolder.length > 0 ? (
                      listFolder.map((folder) => (
                        <label
                          key={folder.id}
                          className="flex items-center gap-2 py-1 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={localSelectedFolders.includes(folder.id)}
                            onChange={() => handleSelectFolder(folder.id)}
                          />
                          <span className="text-sm">{folder.name}</span>
                        </label>
                      ))
                    ) : (
                      <p>No folders available</p>
                    )}
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button className="btnPopup" onClick={handleConfirmClick}>
                OK
              </Button>
              <Button className="btnPopup" onClick={onClose}>
                Cancel
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
