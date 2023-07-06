import { MailService } from 'src/mail/mail.service';
import { JwtService } from 'src/jwt/jwt.service';
import { Verification } from './entities/verification.entity';
import { User } from 'src/users/entities/user.entity';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';

const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(),
  findOneOrFail: jest.fn(),
});

const mockJwtService = {
  sign: jest.fn(() => 'signed-token-baby'),
  verify: jest.fn(),
};

const mockMailService = {
  sendVerificationEmail: jest.fn(),
};

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UserService', () => {
  let service: UsersService;
  let usersRepository: MockRepository<User>;
  let verificationsRepository: MockRepository<Verification>;
  let mailService: MailService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const modules = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();
    service = modules.get<UsersService>(UsersService);
    mailService = modules.get<MailService>(MailService);
    jwtService = modules.get<JwtService>(JwtService);
    usersRepository = modules.get(getRepositoryToken(User));
    verificationsRepository = modules.get(getRepositoryToken(Verification));
  });

  it('be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createACcount', () => {
    const createAccountArgs = {
      email: 'river.key93@gmail.com',
      password: 'asdfasdfasdf',
      role: 0,
    };
    it('should fail if user exists', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'asdasdasdsd',
      });
      const result = await service.createACcount(createAccountArgs);
      expect(result).toMatchObject({
        ok: false,
        error: 'There is a user with that email already',
      });
    });

    it('should create a new user', async () => {
      usersRepository.findOne.mockReturnValue(undefined);
      usersRepository.create.mockReturnValue(createAccountArgs);
      usersRepository.save.mockResolvedValue(createAccountArgs);
      verificationsRepository.create.mockReturnValue({
        user: createAccountArgs,
      });
      verificationsRepository.save.mockResolvedValue({
        code: 'code',
      });

      const result = await service.createACcount(createAccountArgs);
      expect(usersRepository.create).toHaveBeenCalledTimes(1);
      expect(usersRepository.create).toHaveBeenCalledWith(createAccountArgs);
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(createAccountArgs);
      expect(verificationsRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.create).toHaveBeenCalledWith({
        user: createAccountArgs,
      });

      expect(verificationsRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.save).toHaveBeenCalledWith({
        user: createAccountArgs,
      });
      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );
      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.createACcount(createAccountArgs);
      expect(result).toEqual({
        ok: false,
        error: "Couldn't create acoount",
      });
    });
  });

  describe('login', () => {
    const loginArgs = {
      email: 'river.key93@gmail.com',
      password: 'asdfasdf',
    };

    it('should fail if user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      const result = await service.login(loginArgs);
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginArgs.email },
        select: ['id', 'password'],
      });

      expect(result).toEqual({
        ok: false,
        error: 'User not found',
      });
    });

    it('should fail if the password is invalid', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login({
        ...loginArgs,
        password: 'wrong_password',
      });
      expect(result).toEqual({ ok: false, error: 'Wrong Password' });
    });

    it('should return token if password  correct', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(mockedUser.id);

      expect(result).toEqual({ ok: true, token: 'signed-token-baby' });
    });

    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.login(loginArgs);
      expect(result).toEqual({ ok: false, error: new Error() });
    });
  });

  describe('findById', () => {
    const MOCK_USER_ID = 1;

    it('should find by id', async () => {
      const mockUser = {
        id: 1,
        email: 'river.key93@gmail.com',
        role: 0,
      };
      usersRepository.findOneOrFail.mockResolvedValue(mockUser);
      const result = await service.findById(MOCK_USER_ID);
      expect(usersRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: MOCK_USER_ID },
      });
      expect(result).toEqual({
        ok: true,
        user: mockUser,
      });
    });

    it('should fail if user does not exist', async () => {
      usersRepository.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.findById(MOCK_USER_ID);

      expect(result).toEqual({
        ok: false,
        error: new Error(),
      });
    });
  });

  describe('editProfile', () => {
    const mockUser = {
      id: 1,
      email: 'test@test.com',
      password: 'password',
      role: 0,
      verified: true,
    };
    const mockVerification = {
      id: 1,
      code: 'verificationCode',
    };
    const editProfileArgs = {
      email: 'newemail@test.com',
      password: 'newpassword',
    };

    it('should fail if user does not exist', async () => {
      usersRepository.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.editProfile(mockUser.id, editProfileArgs);

      expect(result).toEqual({
        ok: false,
        error: new Error(),
      });
    });

    it('should fail on exception', async () => {
      usersRepository.findOneOrFail.mockResolvedValue(mockUser);
      verificationsRepository.save.mockRejectedValue(new Error());
      const result = await service.editProfile(mockUser.id, editProfileArgs);

      expect(result).toEqual({
        ok: false,
        error: new Error(),
      });
    });

    it('should edit a users email', async () => {
      const newUser = {
        ...mockUser,
        email: editProfileArgs.email,
      };
      usersRepository.findOneOrFail.mockResolvedValue(mockUser);
      verificationsRepository.create.mockReturnValue(mockVerification);
      verificationsRepository.save.mockResolvedValue(mockVerification);

      const result = await service.editProfile(mockUser.id, {
        email: editProfileArgs.email,
      });
      expect(usersRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(verificationsRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.create).toHaveBeenCalledWith({
        user: newUser,
      });
      expect(verificationsRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.save).toHaveBeenCalledWith(
        mockVerification,
      );
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(newUser);

      expect(result).toEqual({
        ok: true,
      });
    });

    it('should edit a users password', async () => {
      const newUser = { ...mockUser, password: editProfileArgs.password };
      usersRepository.findOneOrFail.mockResolvedValue(mockUser);
      usersRepository.save.mockResolvedValue(newUser);

      const result = await service.editProfile(mockUser.id, {
        password: editProfileArgs.password,
      });
      expect(usersRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(newUser);

      expect(result).toEqual({
        ok: true,
      });
    });
  });

  describe('verifyEmail', () => {
    const mockCode = 'mockcode';

    it('should verify email', async () => {
      const mockedVerification = {
        user: {
          verified: false,
        },
        id: 1,
      };
      verificationsRepository.findOneOrFail.mockResolvedValue(
        mockedVerification,
      );
      await service.verifyEmail('');
      expect(verificationsRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.findOneOrFail).toHaveBeenCalledWith(
        expect.any(Object),
      );
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith({
        verified: true,
      });
      expect(verificationsRepository.delete).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.delete).toHaveBeenCalledWith(
        mockedVerification.id,
      );
    });
    it('should fail if verification does not exist', async () => {
      verificationsRepository.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.verifyEmail(mockCode);
      expect(result).toEqual({
        ok: false,
        error: new Error(),
      });
    });
  });
});
