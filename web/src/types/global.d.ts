interface ImpRsp {
  success: boolean;
  imp_uid?: string;
  error_msg?: string;
  vbank_num?: string;
  vbank_name?: string;
  vbank_holder?: string;
  vbank_date?: number;
}

interface IMP {
  init: (impCode: string) => void;
  request_pay: (
    params: {
      pg?: string;
      pay_method?: string;
      merchant_uid: string;
      name: string;
      amount: number;
      buyer_email?: string;
      buyer_name?: string;
      buyer_tel?: string;
    },
    callback: (rsp: ImpRsp) => void
  ) => void;
}

interface DaumPostcodeData {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
}

interface DaumPostcode {
  new (options: { oncomplete: (data: DaumPostcodeData) => void }): { open: () => void };
}

declare global {
  interface Window {
    IMP?: IMP;
    daum?: {
      Postcode: DaumPostcode;
    };
  }
}

export {};
