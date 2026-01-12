import { Test, type TestingModule } from '@nestjs/testing';

import { USER_ROLE } from './constants/user_role.enum';
import type { GetUsersDto } from './dto/getUsers.dto';
import type { UserResponseDto } from './dto/user-response.dto';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let getUsersMock: jest.MockedFunction<UserService['getUsers']>;

  beforeEach(async () => {
    getUsersMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            getUsers: getUsersMock,
          } satisfies Pick<UserService, 'getUsers'>,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  describe('getUsers', () => {
    it('should delegate to UserService.getUsers', async () => {
      const query: GetUsersDto = { role: USER_ROLE.ADMIN };
      const expected: UserResponseDto[] = [];
      getUsersMock.mockResolvedValue(expected);

      await expect(controller.getUsers(query)).resolves.toBe(expected);
      expect(getUsersMock).toHaveBeenCalledTimes(1);
      expect(getUsersMock).toHaveBeenCalledWith(query);
    });
  });
});

