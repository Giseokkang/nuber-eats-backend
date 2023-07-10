import { query } from 'express';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Verification } from 'src/users/entities/verification.entity';

jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});

const GRAPHQL_ENDPOINT = '/graphql';

const testUser = {
  email: 'rkdrltjr10@naver.com',
  password: '12345',
};

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let verificationsRepository: Repository<Verification>;
  let jwtToken: string;

  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest().set('x-jwt', jwtToken).send({ query });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verificationsRepository = module.get<Repository<Verification>>(
      getRepositoryToken(Verification),
    );
    await app.init();
  });

  afterAll(async () => {
    const dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    const connection: DataSource = await dataSource.initialize();
    await connection.dropDatabase(); // 데이터베이스 삭제
    await connection.destroy(); // 연결 해제
    await app.close();
  });

  describe('createAccount', () => {
    it('should create account', () => {
      return publicTest(`
      mutation{
        createAccount(input:{
          email:"${testUser.email}",
          password:"${testUser.password}",
          role:Owner
        }) {
          ok
          error
        }
      }`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.ok).toBeTruthy();
          expect(res.body.data.createAccount.error).toBe(null);
        });
    });

    it('should fail if account already exist', async () => {
      return publicTest(`
      mutation{
        createAccount(input:{
          email:"${testUser.email}",
          password:"${testUser.password}",
          role:Owner
        }) {
          ok
          error
        }
      }`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.ok).toBeFalsy();
          expect(res.body.data.createAccount.error).toBe(
            'There is a user with that email already',
          );
        });
    });
  });
  describe('login', () => {
    it('should login with correct credential', async () => {
      return publicTest(`
      mutation{
        login(input:{
          email:"${testUser.email}",
          password:"${testUser.password}",
        }){
          ok
          error
          token
        }
       }
      `)
        .expect(200)
        .expect((res) => {
          const { ok, error, token } = res.body.data.login;
          expect(ok).toBeTruthy();
          expect(error).toBe(null);
          expect(token).toEqual(expect.any(String));
          jwtToken = token;
        });
    });
    it('should fail with wrong credential', async () => {
      return publicTest(`
              mutation{
          login(input:{
            email:"${testUser.email}_wrong",
            password:"${testUser.password}_wrong",
          }){
            ok
            error
            token
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          const { ok, error, token } = res.body.data.login;
          expect(ok).toBeFalsy();
          expect(error).toBe('User not found');
          expect(token).toBeNull();
        });
    });
  });

  describe('userProfile', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });
    it("should see a user's profile", async () => {
      return privateTest(`
      {
        userProfile(userId:${userId}){
          ok
          error
          user{
            id
          }
        }
      }
      `)
        .expect(200)
        .expect((res) => {
          const {
            ok,
            error,
            user: { id },
          } = res.body.data.userProfile;
          expect(ok).toBeTruthy();
          expect(error).toBe(null);
          expect(id).toBe(userId);
        });
    });

    it('should not find a profile', async () => {
      return privateTest(`
      {
        userProfile(userId:1111){
          ok
          error
          user{
            id
          }
        }
      }
      `)
        .expect(200)
        .expect((res) => {
          const { ok, error, user } = res.body.data.userProfile;
          expect(ok).toBeFalsy();
          expect(error).toEqual(null);
          expect(user).toBeNull();
        });
    });
  });
  describe('me', () => {
    it('should find my profile', () => {
      return privateTest(`{
        me{
          email
        }
      }`)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;
          expect(email).toBe(testUser.email);
        });
    });
    it('should not allow logged out user', () => {
      return publicTest(`{
        me{
          email
        }
      }`)
        .expect(200)
        .expect((res) => {
          const {
            body: { errors },
          } = res;
          const [error] = errors;
          expect(error.message).toBe('Forbidden resource');
        });
    });
  });

  describe('editProfile', () => {
    const NEW_EMAIL = 'new@new.new';
    it('should change email', () => {
      return privateTest(`
              mutation{
                 editProfile(input:{
                 email:"${NEW_EMAIL}",
                 }) {
                 ok
                 error
                 }
              }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                editProfile: { ok, error },
              },
            },
          } = res;
          expect(ok).toBeTruthy();
          expect(error).toBeNull();
        });
    });

    it('should have new email', () => {
      return privateTest(`{
        me{
          email
        }
      }`)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;
          expect(email).toBe(NEW_EMAIL);
        });
    });
  });

  describe('verifyEmail', () => {
    let code: string;
    it('should verify email', async () => {
      const [user] = await usersRepository.find();
      const verification = await verificationsRepository.findOneBy({
        user: { id: user.id },
      });
      code = verification.code;
      return publicTest(`
            mutation{
              verifyEmail(input:{code:"${code}"}){
                error
                ok
              }
            }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBeTruthy();
          expect(error).toBeNull();
        });
    });

    it('should has no verification', async () => {
      const verification = await verificationsRepository.findOneBy({
        code,
      });
      expect(verification).toBeNull();
    });

    it('should fail if there is no verification', () => {
      const FAKE_CODE = 'fake_code';
      return publicTest(`
            mutation{
              verifyEmail(input:{code:"${FAKE_CODE}"}){
                error
                ok
              }
            }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBeFalsy();
          expect(error).toBe('Verification not found.');
        });
    });
  });
});
