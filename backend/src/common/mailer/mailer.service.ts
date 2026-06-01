import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { type Transporter } from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const host = this.config.get<string>('EMAIL_HOST');
    const port = Number(this.config.get<string>('EMAIL_PORT') || 587);
    const user = this.config.get<string>('EMAIL_USERNAME');
    const pass = this.config.get<string>('EMAIL_PASSWORD');

    console.log({
      host,
      port,
      user,
      pass,
    });
    if (!host || !user || !pass) return null;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });
    return this.transporter;
  }

  async sendOtpEmail(params: {
    to: string;
    code: string;
    purpose: 'email_verify' | 'password_reset' | 'transaction';
  }) {
    const transporter = this.getTransporter();
    const user =
      this.config.get<string>('EMAIL_USERNAME') || 'no-reply@vbank.local';
    const from = `VBANK Internet Banking <${user}>`;

    if (!transporter) {
      this.logger.warn(`SMTP not configured. Skipping email to ${params.to}.`);
      return { sent: false as const };
    }

    const configs = {
      email_verify: {
        subject: '✅ Xác minh tài khoản VBANK',
        title: 'Xác Minh Email',
        subtitle: 'Vui lòng dùng mã bên dưới để xác minh tài khoản của bạn',
        headerColor: '#0C447C',
        accentColor: '#1A5999',
        icon: '🏛',
        actionText: 'xác minh tài khoản',
      },
      password_reset: {
        subject: '🔐 Đặt lại mật khẩu VBANK',
        title: 'Đặt Lại Mật Khẩu',
        subtitle: 'Chúng tôi nhận được yêu cầu đặt lại mật khẩu của bạn',
        headerColor: '#0C447C',
        accentColor: '#1A5999',
        icon: '🔑',
        actionText: 'đặt lại mật khẩu',
      },
      transaction: {
        subject: '🔒 Xác thực giao dịch VBANK',
        title: 'Xác Thực Giao Dịch',
        subtitle: 'Mã OTP để xác nhận giao dịch của bạn',
        headerColor: '#0C447C',
        accentColor: '#1A5999',
        icon: '🔒',
        actionText: 'xác nhận giao dịch',
      },
    };

    const cfg = configs[params.purpose];

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cfg.subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="min-height:100vh;background:#f3f4f6;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${cfg.headerColor} 0%,${cfg.accentColor} 100%);border-radius:16px 16px 0 0;padding:32px 32px 24px;text-align:center;">
              <div style="font-size:40px;margin-bottom:12px;">${cfg.icon}</div>
              <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">VBANK</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">Ngân hàng số thông minh & bảo mật</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:32px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;text-align:center;">${cfg.title}</h1>
              <p style="margin:0 0 28px;font-size:14px;color:#6b7280;text-align:center;line-height:1.6;">${cfg.subtitle}</p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;padding:0 0 24px;">
                    <div style="display:inline-block;background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%);border:2px solid #e2e8f0;border-radius:16px;padding:20px 40px;">
                      <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#9ca3af;margin-bottom:8px;text-transform:uppercase;">Mã OTP của bạn</div>
                      <div style="font-size:42px;font-weight:900;letter-spacing:10px;color:#111827;font-feature-settings:'tnum';font-variant-numeric:tabular-nums;">${params.code}</div>
                      <div style="font-size:12px;color:#ef4444;margin-top:10px;font-weight:600;">⏱ Hiệu lực trong 10 phút</div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-left:4px solid ${cfg.headerColor};border-radius:0 8px 8px 0;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <div style="font-size:13px;color:#1e40af;font-weight:600;margin-bottom:4px;">📋 Hướng dẫn</div>
                    <div style="font-size:13px;color:#1e40af;line-height:1.5;">Nhập mã OTP này vào ứng dụng VBANK để ${cfg.actionText}.</div>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 16px;">
                    <div style="font-size:12px;color:#92400e;line-height:1.5;">
                      🔒 <strong>Bảo mật:</strong> VBANK sẽ KHÔNG BAO GIỜ hỏi mã OTP qua điện thoại hay tin nhắn. Không chia sẻ mã này với bất kỳ ai.
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;">
                Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email và liên hệ hỗ trợ ngay.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
              <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:6px;">VBANK Internet Banking</div>
              <div style="font-size:11px;color:#9ca3af;line-height:1.6;">
                Email tự động — Vui lòng không trả lời email này.<br>
                © 2026 VBANK. Tất cả quyền được bảo lưu.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = `${cfg.title}\n\n${cfg.subtitle}\n\nMã OTP: ${params.code}\nHiệu lực: 10 phút\n\nKhông chia sẻ mã này với bất kỳ ai.\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.`;

    try {
      await transporter.sendMail({
        from,
        to: params.to,
        subject: cfg.subject,
        text,
        html,
      });
      return { sent: true as const };
    } catch (err) {
      this.logger.error(`Failed to send OTP email to ${params.to}`, err);
      return { sent: false as const };
    }
  }

  async sendTransactionEmail(params: {
    to: string;
    type: 'transfer_out' | 'transfer_in' | 'topup' | 'withdraw' | 'qr_payment';
    amount: number;
    reference: string;
    recipientName?: string;
    recipientEmail?: string;
    senderName?: string;
    senderEmail?: string;
    description?: string;
    newBalance?: number;
    date?: Date;
  }) {
    const transporter = this.getTransporter();
    const user = this.config.get<string>('EMAIL_USERNAME') || 'no-reply@vbank.local';
    const from = `VBANK Internet Banking <${user}>`;

    if (!transporter) {
      this.logger.warn(`SMTP not configured. Skipping transaction email to ${params.to}.`);
      return { sent: false as const };
    }

    const typeMap: Record<string, { label: string; subject: string; amountPrefix: string; color: string; icon: string }> = {
      transfer_out: { label: 'Chuyển tiền đi', subject: '💸 Xác nhận chuyển tiền - VBANK', amountPrefix: '-', color: '#EF4444', icon: '→' },
      transfer_in: { label: 'Nhận tiền', subject: '💰 Bạn vừa nhận được tiền - VBANK', amountPrefix: '+', color: '#10B981', icon: '←' },
      topup: { label: 'Nạp tiền vào ví', subject: '✅ Nạp tiền thành công - VBANK', amountPrefix: '+', color: '#10B981', icon: '↑' },
      withdraw: { label: 'Rút tiền', subject: '🏧 Rút tiền thành công - VBANK', amountPrefix: '-', color: '#EF4444', icon: '↓' },
      qr_payment: { label: 'Thanh toán QR', subject: '📱 Thanh toán QR thành công - VBANK', amountPrefix: '-', color: '#8B5CF6', icon: '▣' },
    };

    const info = typeMap[params.type];
    const amountFormatted = params.amount.toLocaleString('vi-VN');
    const dateStr = (params.date ?? new Date()).toLocaleString('vi-VN', { hour12: false, timeZone: 'Asia/Ho_Chi_Minh' });

    const counterpartRow = params.type === 'transfer_out' && params.recipientName
      ? `<tr><td style="padding:12px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:#64748B;font-weight:600;">Người nhận</td><td style="padding:12px 0;border-bottom:1px solid #F1F5F9;font-size:13px;font-weight:700;color:#0F172A;text-align:right;">${params.recipientName}<br><span style="color:#94A3B8;font-weight:400;">${params.recipientEmail ?? ''}</span></td></tr>`
      : params.type === 'transfer_in' && params.senderName
      ? `<tr><td style="padding:12px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:#64748B;font-weight:600;">Người gửi</td><td style="padding:12px 0;border-bottom:1px solid #F1F5F9;font-size:13px;font-weight:700;color:#0F172A;text-align:right;">${params.senderName}<br><span style="color:#94A3B8;font-weight:400;">${params.senderEmail ?? ''}</span></td></tr>`
      : '';

    const descriptionRow = params.description
      ? `<tr><td style="padding:12px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:#64748B;font-weight:600;">Nội dung</td><td style="padding:12px 0;border-bottom:1px solid #F1F5F9;font-size:13px;font-weight:600;color:#0F172A;text-align:right;">${params.description}</td></tr>`
      : '';

    const balanceRow = params.newBalance !== undefined
      ? `<tr><td style="padding:12px 0;font-size:13px;color:#64748B;font-weight:600;">Số dư sau GD</td><td style="padding:12px 0;font-size:14px;font-weight:800;color:#0C447C;text-align:right;">${params.newBalance.toLocaleString('vi-VN')} đ</td></tr>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${info.subject}</title></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="min-height:100vh;background:#F1F5F9;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0C447C 0%,#1A5999 100%);border-radius:16px 16px 0 0;padding:28px 32px 22px;text-align:center;">
          <div style="width:52px;height:52px;background:rgba(255,255,255,0.15);border-radius:14px;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;font-size:24px;line-height:52px;">${info.icon}</div>
          <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">VBANK</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;">Ngân hàng số thông minh & bảo mật</div>
        </td></tr>
        <!-- Amount Hero -->
        <tr><td style="background:#fff;padding:28px 32px 20px;text-align:center;border-bottom:1px solid #F1F5F9;">
          <div style="font-size:12px;font-weight:700;letter-spacing:1.5px;color:#94A3B8;text-transform:uppercase;margin-bottom:10px;">${info.label}</div>
          <div style="font-size:40px;font-weight:900;color:${info.color};letter-spacing:-2px;font-feature-settings:'tnum';">${info.amountPrefix}${amountFormatted} <span style="font-size:20px;font-weight:700;">đ</span></div>
          <div style="display:inline-block;margin-top:12px;padding:6px 14px;background:#ECFDF5;border-radius:99px;font-size:12px;font-weight:700;color:#059669;">✓ Giao dịch thành công</div>
        </td></tr>
        <!-- Details -->
        <tr><td style="background:#fff;padding:8px 32px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:12px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:#64748B;font-weight:600;">Mã tham chiếu</td><td style="padding:12px 0;border-bottom:1px solid #F1F5F9;font-size:12px;font-weight:700;color:#0F172A;text-align:right;font-family:monospace;">${params.reference}</td></tr>
            <tr><td style="padding:12px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:#64748B;font-weight:600;">Thời gian</td><td style="padding:12px 0;border-bottom:1px solid #F1F5F9;font-size:13px;font-weight:600;color:#0F172A;text-align:right;">${dateStr}</td></tr>
            ${counterpartRow}
            ${descriptionRow}
            ${balanceRow}
          </table>
        </td></tr>
        <!-- Security Notice -->
        <tr><td style="background:#FFF7ED;padding:14px 32px;border:1px solid #FDE68A;">
          <div style="font-size:12px;color:#92400E;line-height:1.5;">🔒 <strong>Bảo mật:</strong> VBANK sẽ KHÔNG BAO GIỜ yêu cầu mã OTP, mật khẩu qua điện thoại hay email. Nếu không phải bạn thực hiện giao dịch này, hãy liên hệ ngay 1900 6868.</div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#F9FAFB;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;border-top:1px solid #E5E7EB;">
          <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:6px;">VBANK Internet Banking</div>
          <div style="font-size:11px;color:#9CA3AF;line-height:1.6;">Email tự động — Vui lòng không trả lời email này.<br>© 2026 VBANK. Tất cả quyền được bảo lưu.</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const text = `${info.label}\nSố tiền: ${info.amountPrefix}${amountFormatted}đ\nMã GD: ${params.reference}\nThời gian: ${dateStr}\nSố dư: ${params.newBalance?.toLocaleString('vi-VN') ?? 'N/A'}đ`;

    try {
      await transporter.sendMail({ from, to: params.to, subject: info.subject, text, html });
      return { sent: true as const };
    } catch (err) {
      this.logger.error(`Failed to send transaction email to ${params.to}`, err);
      return { sent: false as const };
    }
  }
}
