export interface SendMailOptions {
  to: string
  subject: string
  body: string
}

export interface MailService {
  sendMail(_options: SendMailOptions): Promise<void>
}

export class ConsoleMailService implements MailService {
  async sendMail({ to, subject, body }: SendMailOptions): Promise<void> {
    console.log(`[MailService] Sending email to ${to}: ${subject}\n${body}`)
  }
}
