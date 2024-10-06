import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class EditTaskDTO {
    @IsNumber()
    @ApiProperty()
    id: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    name?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    description?: string;

    @IsOptional()
    @IsBoolean()
    @ApiProperty({ required: false })
    isDone?: boolean;

    constructor(
        id: number,
        name: string,
        description: string,
        isDone: boolean,
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.isDone = isDone;
    }
}
