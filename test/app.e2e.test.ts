import {
    ClassSerializerInterceptor,
    INestApplication,
    ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { AppModule } from 'src/app.module';
import { AuthDTO, RegisterDTO } from 'src/auth/dto';
import { CreateTaskDTO, EditTaskDTO } from 'src/resource/task/dto';
import { EditUserDTO } from 'src/resource/user/dto';

describe('App e2e test', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleRef.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
            }),
        );
        app.useGlobalInterceptors(
            new ClassSerializerInterceptor(app.get(Reflector), {
                strategy: 'excludeAll',
                excludeExtraneousValues: true,
            }),
        );

        await app.listen(5000);
        pactum.request.setBaseUrl('http://localhost:5000');
    });

    afterAll(async () => {
        await app.close();
    });

    describe('App Module', () => {
        it('Hello world', async () => {
            await pactum
                .spec()
                .get('/')
                .expectStatus(200)
                .expectBody('Hello World!');
        });
    });

    describe('Auth Module', () => {
        describe('Register', () => {
            const dto = new RegisterDTO(
                'stanley',
                's.mazik2002@gmail.com',
                'stachu02',
            );

            it('Should fail if no body', async () => {
                await pactum.spec().post('/auth/register').expectStatus(400);
            });

            it('Should fail if no username', async () => {
                await pactum
                    .spec()
                    .post('/auth/register')
                    .withBody({
                        email: dto.email,
                        password: dto.password,
                    })
                    .expectStatus(400);
            });

            it('Should fail if no email', async () => {
                await pactum
                    .spec()
                    .post('/auth/register')
                    .withBody({
                        username: dto.username,
                        password: dto.password,
                    })
                    .expectStatus(400);
            });

            it('Should fail if no password', async () => {
                await pactum
                    .spec()
                    .post('/auth/register')
                    .withBody({
                        username: dto.username,
                        email: dto.email,
                    })
                    .expectStatus(400);
            });

            it('Should register correct user', async () => {
                await pactum
                    .spec()
                    .post('/auth/register')
                    .withBody(dto)
                    .expectStatus(201)
                    .expectJsonSchema({
                        properties: {
                            accessToken: {
                                type: 'string',
                            },
                        },
                    });
            });

            it('Should fail if mail already used', async () => {
                await pactum
                    .spec()
                    .post('/auth/register')
                    .withBody(dto)
                    .expectStatus(409);
            });
        });

        describe('Login', () => {
            const dto = new AuthDTO('s.mazik2002@gmail.com', 'stachu02');

            it('Should fail if empty body', async () => {
                await pactum.spec().post('/auth/login').expectStatus(400);
            });

            it('Should fail if no email', async () => {
                await pactum
                    .spec()
                    .post('/auth/login')
                    .withBody({ password: dto.password })
                    .expectStatus(400);
            });

            it('Should fail if no password', async () => {
                await pactum
                    .spec()
                    .post('/auth/login')
                    .withBody({ email: dto.email })
                    .expectStatus(400);
            });

            it('Should fail if incorrect password', async () => {
                await pactum
                    .spec()
                    .post('/auth/login')
                    .withBody({ email: dto.email, password: 'wrong_password' })
                    .expectStatus(401);
            });

            it("Should fail if user doesn't exist", async () => {
                await pactum
                    .spec()
                    .post('/auth/login')
                    .withBody({
                        email: 'smazik@mail.com',
                        password: dto.password,
                    })
                    .expectStatus(404);
            });

            it('Should login correct user', async () => {
                await pactum
                    .spec()
                    .post('/auth/login')
                    .withBody(dto)
                    .expectStatus(200)
                    .expectJsonSchema({
                        properties: {
                            accessToken: {
                                type: 'string',
                            },
                        },
                    });
            });
        });

        it.todo('Google login');
    });

    describe('User Module', () => {
        describe('Get me', () => {
            it('Should fail if no token', async () => {
                await pactum.spec().get('/users/me').expectStatus(401);
            });

            it('Should return correct user', async () => {
                await pactum
                    .spec()
                    .post('/auth/login')
                    .withBody(new AuthDTO('admin@local.host', 'admin'))
                    .expectStatus(200)
                    .stores('adminToken', 'accessToken');

                await pactum
                    .spec()
                    .get('/users/me')
                    .withBearerToken('$S{adminToken}')
                    .expectStatus(200)
                    .expectJsonSchema({
                        properties: {
                            id: { type: 'number' },
                            username: { type: 'string' },
                            email: { type: 'string' },
                            role: { type: 'string' },
                        },
                    })
                    .expectJson({
                        id: 1,
                        username: 'admin',
                        email: 'admin@local.host',
                        role: 'ADMIN',
                    });
            });
        });

        describe('Edit me', () => {
            const dto: EditUserDTO = {
                username: 'admin2',
                email: 'admin2@local.host',
            };

            it('Should fail if no token', async () => {
                await pactum.spec().patch('/users/me').expectStatus(401);
            });

            it('Should fail if no body', async () => {
                await pactum
                    .spec()
                    .patch('/users/me')
                    .withBearerToken('$S{adminToken}')
                    .expectStatus(400);
            });

            it('Should successfully edit user', async () => {
                await pactum
                    .spec()
                    .patch('/users/me')
                    .withBearerToken('$S{adminToken}')
                    .withBody(dto)
                    .expectStatus(200)
                    .expectJsonSchema({
                        properties: {
                            id: { type: 'number' },
                            username: { type: 'string' },
                            email: { type: 'string' },
                            role: { type: 'string' },
                        },
                    })
                    .expectJson({
                        id: 1,
                        username: 'admin2',
                        email: 'admin2@local.host',
                        role: 'ADMIN',
                    });
            });
        });

        describe('Get User by Id', () => {
            it('Should fail if no token', async () => {
                await pactum.spec().get('/users/2').expectStatus(401);
            });

            it('Should fail if no user found', async () => {
                await pactum
                    .spec()
                    .get('/users/222')
                    .withBearerToken('$S{adminToken}')
                    .expectStatus(404);
            });

            it('Should fail if user is not an admin', async () => {
                await pactum
                    .spec()
                    .post('/auth/login')
                    .withBody(new AuthDTO('user@local.host', 'user'))
                    .expectStatus(200)
                    .stores('userToken', 'userToken');

                await pactum
                    .spec()
                    .get('/users/1')
                    .withBearerToken('$S{userToken}')
                    .expectStatus(401);
            });

            it('Should return correct user', async () => {
                await pactum
                    .spec()
                    .get('/users/2')
                    .withBearerToken('$S{adminToken}')
                    .expectStatus(200)
                    .expectJsonSchema({
                        properties: {
                            id: { type: 'number' },
                            username: { type: 'string' },
                            email: { type: 'string' },
                            role: { type: 'string' },
                        },
                    })
                    .expectJson({
                        id: 2,
                        username: 'user',
                        email: 'user@local.host',
                        role: 'USER',
                    });
            });
        });
    });

    describe('Event Module', () => {});

    describe('Note Module', () => {});

    describe('Task Module', () => {
        describe('Add task', () => {
            const dto: CreateTaskDTO = {
                name: 'test',
                description: 'description',
                isDone: false,
            };

            it('Should fail if no token', async () => {
                await pactum.spec().post('/tasks').expectStatus(401);
            });

            it('Should fail if no body', async () => {
                await pactum
                    .spec()
                    .post('/tasks')
                    .withBearerToken('$S{adminToken}')
                    .expectStatus(400);
            });

            it('Should fail if no name', async () => {
                await pactum
                    .spec()
                    .post('/tasks')
                    .withBearerToken('$S{adminToken}')
                    .withBody({ description: 'description', isDone: false })
                    .expectStatus(400);
            });

            it('Should create a task', async () => {
                await pactum
                    .spec()
                    .post('/tasks')
                    .withBearerToken('$S{adminToken}')
                    .withBody(dto)
                    .expectStatus(201)
                    .expectJsonSchema({
                        properties: {
                            id: { type: 'number' },
                            name: { type: 'string' },
                            description: { type: 'string' },
                            isDone: { type: 'boolean' },
                        },
                    })
                    .expectJson({
                        id: 1,
                        name: dto.name,
                        description: dto.description,
                        isDone: dto.isDone,
                    });
            });
        });

        describe("Get User's Tasks", () => {
            it('Should fail if no token', async () => {
                await pactum.spec().get('/tasks').expectStatus(401);
            });

            it("Should return user's tasks", async () => {
                await pactum
                    .spec()
                    .get('/tasks')
                    .withBearerToken('$S{adminToken}')
                    .expectStatus(200)
                    .expectJsonSchema({
                        properties: {
                            id: { type: 'number' },
                            name: { type: 'string' },
                            description: { type: 'string' },
                            isDone: { type: 'boolean' },
                        },
                    })
                    .expectJsonLength(1);
            });
        });

        describe('Get Task by id', () => {
            it('Should fail if no token', async () => {
                await pactum.spec().get('/tasks/1').expectStatus(401);
            });

            it('Should fail if task not found', async () => {
                await pactum
                    .spec()
                    .get('/tasks/100')
                    .withBearerToken('$S{adminToken}')
                    .expectStatus(404);
            });

            it('Should return a task', async () => {
                await pactum
                    .spec()
                    .get('/tasks/1')
                    .withBearerToken('$S{adminToken}')
                    .expectStatus(200)
                    .expectJsonSchema({
                        properties: {
                            id: { type: 'number' },
                            name: { type: 'string' },
                            description: { type: 'string' },
                            isDone: { type: 'boolean' },
                        },
                    });
            });
        });

        describe('Edit Task', () => {
            const dto: EditTaskDTO = {
                id: 1,
                name: 'test2',
                description: 'description2',
                isDone: true,
            };

            it('Should fail if no token', async () => {
                await pactum.spec().patch('/tasks/1').expectStatus(401);
            });

            it('Should fail if no body', async () => {
                await pactum
                    .spec()
                    .patch('/tasks/1')
                    .withBearerToken('$S{adminToken}')
                    .expectStatus(400);
            });

            it('Should fail if no task id in body', async () => {
                await pactum
                    .spec()
                    .patch('/tasks/1')
                    .withBearerToken('$S{adminToken}')
                    .withBody({ name: dto.name, description: dto.description })
                    .expectStatus(400);
            });

            it("Should fail if ID in URL and body don't match", async () => {
                await pactum
                    .spec()
                    .patch('/tasks/1')
                    .withBearerToken('$S{adminToken}')
                    .withBody({ ...dto, id: 2 })
                    .expectStatus(400);
            });

            it("Should fail if task doesn't exist", async () => {
                await pactum
                    .spec()
                    .patch('/tasks/2')
                    .withBearerToken('$S{adminToken}')
                    .withBody({ ...dto, id: 2 })
                    .expectStatus(404);
            });

            it('Should edit task', async () => {
                await pactum
                    .spec()
                    .patch('/tasks/1')
                    .withBearerToken('$S{adminToken}')
                    .withBody(dto)
                    .expectStatus(200)
                    .expectJsonSchema({
                        properties: {
                            id: { type: 'number' },
                            name: { type: 'string' },
                            description: { type: 'string' },
                            isDone: { type: 'boolean' },
                        },
                    })
                    .expectJson({
                        id: 1,
                        name: dto.name,
                        description: dto.description,
                        isDone: dto.isDone,
                    });
            });
        });

        describe('Delete task', () => {
            it('Should fail if no token', async () => {
                await pactum.spec().delete('/tasks/1').expectStatus(401);
            });

            it('Should fail if task not found', async () => {
                await pactum
                    .spec()
                    .delete('/tasks/2')
                    .withBearerToken('$S{adminToken}')
                    .expectStatus(404);
            });

            it('Should delete task', async () => {
                await pactum
                    .spec()
                    .delete('/tasks/1')
                    .withBearerToken('$S{adminToken}')
                    .expectStatus(204);
            });

            it("Shouldn't return a deleted task", async () => {
                await pactum
                    .spec()
                    .get('/tasks/1')
                    .withBearerToken('$S{adminToken}')
                    .expectStatus(404);
            });

            it('Should return no tasks', async () => {
                await pactum
                    .spec()
                    .get('/tasks')
                    .withBearerToken('$S{adminToken}')
                    .expectStatus(200)
                    .expectJsonLength(0);
            });
        });
    });

    describe('Search Module', () => {});
});
