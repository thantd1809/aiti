import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Spinner,
} from "@nextui-org/react";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { getMessageByCode } from "../utils/getMessageByCode";
import { E0003, E0005, NAME_LABEL } from "../utils/message";
import { getAllDepart, createDepart } from "../utils/ApiService";
import { toast } from "react-toastify";

type Inputs = {
  name: string;
  parentDepart: string;
};

export default function PopupCreateDepart(props: { statePopup: any }) {
  const [isModalAddDepart, setIsModalAddDepart] = useState(true);
  const [departList, setDepartList] = useState([] as any[]);
  const [opacity, setOpacity] = useState("1");
  const [spinner, setSpinner] = useState(false);
  const [isModalCreateSuccess, setIsModalCreateSuccess] = useState(false);
  const [isModalCreateUserError, setIsModalCreateUserError] = useState(false);
  const errorConnectDB = "psycopg2.OperationalError";
  const [isPopupMessageConnectDB, setIsPopupMessageConnectDB] = useState(false);
  const [errorDB, setErrorDB] = useState("");
  const [valueName, setValueName] = useState("");
  const [valueDepart, setValueDepart] = useState<string | null>(null);

  const closeModal = () => {
    setIsModalAddDepart(false);
    props.statePopup(false);
  };
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      name: "",
      parentDepart: "",
    },
  });

  useEffect(() => {
    getDepart();
  }, []);

  const getDepart = async () => {
    try {
      const response = await getAllDepart();
      if (response?.status == 200) {
        setDepartList(response.data.data.departs);
      } else {
        alert(response.data.result.msg);
      }
    } catch (error) {
      alert(error);
    }
  };

  const hanldeCreateDepart: SubmitHandler<Inputs> = async (e: any) => {
    try {
      let dataCreateUser = {
        name: valueName,
        parent_id: valueDepart,
      };
      setSpinner(true);
      setOpacity("0.5");
      const response = await createDepart(dataCreateUser);

      if (response?.data?.result?.status == "OK") {
        // Show pop up
        toast.success(response.data.result.msg, {
          className: "custom-toast",
          closeButton: false,
          autoClose: 1000,
        });
        window.location.reload();
      } else if (response?.data?.result?.status == "NG") {
        if (response?.data?.result?.code == "E0012") {
          setIsModalCreateUserError(true);
        } else if (response?.data?.result?.code == "E0023") {
        } else if ((response?.data?.result.msg).includes(errorConnectDB)) {
          console.log("create user");
          setIsPopupMessageConnectDB(true);
        } else {
          alert(response?.data?.result.msg);
        }
      }
      setSpinner(false);
      setOpacity("1");
    } catch (error: any) {
      if (error.response.data.result.code == "E0023") {
        setErrorDB(getMessageByCode(error.response?.data?.result?.msg));
        // setIsModalActiveUser(true);
      }
      if (error.response.data.result.code == "E0012") {
        setIsModalCreateUserError(true);
      } else {
        alert(error);
      }
      setSpinner(false);
      setOpacity("1");
    }
  };

  return (
    <>
      <Modal
        isOpen={isModalAddDepart}
        backdrop="blur"
        onClose={closeModal}
        classNames={{
          closeButton: "flex justify-end items-center",
          wrapper: "flex pb-[100px] justify-center items-center",
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="text-black" style={{ marginTop: "25px" }}>
                Department Registration
              </ModalHeader>

              <ModalBody>
                <div style={{ opacity: opacity }}>
                  <form onSubmit={handleSubmit(hanldeCreateDepart)}>
                    <div className="mb-[50px]">
                      <div className="wrapper">
                        <p>Name</p>
                        <div className="input-field">
                          <input
                            placeholder="Name"
                            {...register("name", {
                              required: E0003.replace("{1}", NAME_LABEL),
                              validate: {
                                checkMaxLeghtByByte: (value) => {
                                  if (valueName) {
                                    return (
                                      new Blob([value]).size <= 64 ||
                                      E0005.replace("{1}", NAME_LABEL).replace(
                                        "{2}",
                                        "64",
                                      )
                                    );
                                  } else {
                                    return true;
                                  }
                                },
                              },
                            })}
                            name="name"
                            value={valueName}
                            id="name"
                            onChange={(e) => setValueName(e.target.value)}
                          />
                          {errors.name?.message && (
                            <p className="text-sm text-red-400">
                              {errors.name.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="wrapper">
                        <p>Parent Department</p>
                        <select
                          style={{
                            color: "black",
                            width: "100%",
                            borderStyle: "solid",
                            borderColor: "#cfc9cb",
                            borderWidth: "1px",
                            borderRadius: "5px",
                          }}
                          value={valueDepart ?? ""}
                          onChange={(e) => {
                            const selectedValue = e.target.value;
                            setValueDepart(
                              selectedValue === "" ? null : selectedValue,
                            );
                          }}
                        >
                          <option value="">-- Select a department --</option>
                          {departList.map((depart) => (
                            <option key={depart.id} value={depart.id}>
                              {depart.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="submitBtn">
                      <button type="submit" style={{ color: "white" }}>
                        Register
                      </button>
                    </div>
                  </form>
                </div>
                <div className="spinner">
                  {spinner == true && (
                    <div>
                      <Spinner size="lg" />
                    </div>
                  )}
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
