import {
  E0001,
  E0004,
  E0016,
  E0017,
  E0018,
  E0019,
  E0020,
  E0021,
  // E0023,
  I0002,
  I0008,
} from "./message";

export function getMessageByCode(code: string) {
  switch (code) {
    // Error
    case "E0001":
      return E0001;
    case "E0004":
      return E0004;
    case "E0016":
      return E0016;
    case "E0017":
      return E0017;
    case "E0018":
      return E0018;
    case "E0019":
      return E0019;
    case "E0020":
      return E0020;
    case "E0021":
      return E0021;
    // case "E0023":
    //   return E0023;
    // Info
    case "I0002":
      return I0002;
    case "I0008":
      return I0008;
    default:
      return code;
  }
}
