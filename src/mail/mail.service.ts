import got from 'got';
import * as FormData from 'form-data';
import { Global, Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { EmailVar, MailModuleOptions } from './mail.interfaces';

@Injectable()
@Global()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {}

  private async sendEmail(
    subject: string,
    to: string,
    template: string,
    emailVars: EmailVar[],
  ) {
    const form = new FormData();
    form.append('from', `Excited User <mailgun@${this.options.domain}>`);
    form.append('to', to);
    form.append('subject', subject);
    form.append('template', template);

    emailVars.forEach((eVar) => form.append(`v:${eVar.key}`, eVar.value));
    try {
      const response = await got(
        `https://api.mailgun.net/v3/${this.options.domain}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(
              `api:${this.options.apiKey}`,
            ).toString('base64')}`,
          },
          body: form,
        },
      );
      console.log('??성공?');
      console.log(response.body);
    } catch (error) {
      console.log('verification Error', error);
    }
  }

  async sendVerificationEmail(email: string, code: string) {
    this.sendEmail('Verify Your Email', email, 'nuber-eats-confirm-tamplete', [
      {
        key: 'code',
        value: code,
      },
      {
        key: 'username',
        value: email,
      },
    ]);
  }
}