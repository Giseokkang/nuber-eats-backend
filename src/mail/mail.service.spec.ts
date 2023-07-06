import * as FormData from 'form-data';
import got from 'got';
import { Test } from '@nestjs/testing';
import { MailService } from './mail.service';
import { CONFIG_OPTIONS } from 'src/common/common.constants';

jest.mock('got');
jest.mock('form-data');

const MAINGUN_API_KEY = 'mailgunApiKey';
const MAINGUN_DOMAIN_NAME = 'mailgunDomainNAme';
const MAINGUN_FROM_EMAIL = 'mailgunFromEmail';

const EMAIL = 'river.key93@gmail.com';
const CODE = 'test_code';

describe('mailService', () => {
  let service: MailService;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: CONFIG_OPTIONS,
          useValue: {
            apiKey: MAINGUN_API_KEY,
            domain: MAINGUN_DOMAIN_NAME,
            fromEmail: MAINGUN_FROM_EMAIL,
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('sends mail', async () => {
      jest.spyOn(service, 'sendEmail').mockImplementation(async () => true);
      service.sendVerificationEmail(EMAIL, CODE);
      expect(service.sendEmail).toHaveBeenCalledTimes(1);
      expect(service.sendEmail).toHaveBeenCalledWith(
        'Verify Your Email',
        EMAIL,
        'nuber-eats-confirm-tamplete',
        [
          {
            key: 'code',
            value: CODE,
          },
          {
            key: 'username',
            value: EMAIL,
          },
        ],
      );
    });
  });

  describe('sendEmail', () => {
    it('sends mail', async () => {
      const ok = await service.sendEmail('', '', '', [
        { key: 'asdf', value: 'asdf' },
      ]);
      const formSpy = jest.spyOn(FormData.prototype, 'append');
      expect(formSpy).toHaveBeenCalled();

      expect(got.post).toHaveBeenCalledTimes(1);
      expect(got.post).toHaveBeenCalledWith(
        `https://api.mailgun.net/v3/${MAINGUN_DOMAIN_NAME}/messages`,
        expect.any(Object),
      );
      expect(ok).toBeTruthy();
    });
    it('fails on error', async () => {
      jest.spyOn(got, 'post').mockImplementation(() => {
        throw new Error();
      });
      const ok = await service.sendEmail('', '', '', []);
      expect(ok).toBeFalsy();
    });
  });
});
