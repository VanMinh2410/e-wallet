import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { RedisService } from '../../common/redis/redis.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };
  const mockWalletModel = { create: jest.fn() };
  const mockOtpModel = { create: jest.fn(), findOne: jest.fn() };
  const mockConnection = {
    startSession: jest.fn().mockReturnValue({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: getModelToken('Wallet'), useValue: mockWalletModel },
        { provide: getModelToken('OtpRecord'), useValue: mockOtpModel },
        { provide: getConnectionToken(), useValue: mockConnection },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('token'), verify: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('secret') } },
        { provide: RedisService, useValue: { set: jest.fn(), get: jest.fn(), del: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
