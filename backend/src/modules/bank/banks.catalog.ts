export interface BankCatalogItem {
  code: string;
  name: string;
  shortName: string;
}

/** Danh sách ngân hàng phổ biến tại Việt Nam (mock catalog) */
export const BANK_CATALOG: BankCatalogItem[] = [
  { code: 'VCB', name: 'Ngân hàng TMCP Ngoại thương Việt Nam', shortName: 'Vietcombank' },
  { code: 'TCB', name: 'Ngân hàng TMCP Kỹ thương Việt Nam', shortName: 'Techcombank' },
  { code: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam', shortName: 'BIDV' },
  { code: 'VTB', name: 'Ngân hàng TMCP Công thương Việt Nam', shortName: 'VietinBank' },
  { code: 'ACB', name: 'Ngân hàng TMCP Á Châu', shortName: 'ACB' },
  { code: 'MB', name: 'Ngân hàng TMCP Quân đội', shortName: 'MB Bank' },
  { code: 'VPB', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', shortName: 'VPBank' },
  { code: 'TPB', name: 'Ngân hàng TMCP Tiên Phong', shortName: 'TPBank' },
  { code: 'STB', name: 'Ngân hàng TMCP Sài Gòn Thương Tín', shortName: 'Sacombank' },
  { code: 'HDB', name: 'Ngân hàng TMCP Phát triển TP.HCM', shortName: 'HDBank' },
  { code: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam', shortName: 'VIB' },
  { code: 'SHB', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội', shortName: 'SHB' },
  { code: 'OCB', name: 'Ngân hàng TMCP Phương Đông', shortName: 'OCB' },
  { code: 'MSB', name: 'Ngân hàng TMCP Hàng Hải', shortName: 'MSB' },
  { code: 'LPB', name: 'Ngân hàng Bưu điện Liên việt', shortName: 'LienVietPostBank' },
  { code: 'VNPAY', name: 'Ví điện tử VNPay', shortName: 'VNPay' },
];
