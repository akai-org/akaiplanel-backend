import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const GetUser = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        console.log(request);
        console.log("------");
        console.log(data);
        console.log("------");
        console.log(request.user[data]);
        console.log("------");
        
        if (data) return request.user[data];
        return request.user;
    },
);
