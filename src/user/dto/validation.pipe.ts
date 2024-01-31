// validation.pipe.ts

import { ArgumentMetadata, BadRequestException, PipeTransform, ValidationPipe } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

export class ValidationPipeCustom implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata): Promise<any> {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object, { skipMissingProperties: true });

    if (errors.length > 0) {
      throw new BadRequestException(this.formatErrors(errors));
    }

    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: any[]): string {
    return errors.map((err) => Object.values(err.constraints).join(', ')).join('; ');
  }
}

export class ValidationPipeWithClassValidator extends ValidationPipe {
  constructor() {
    super({
      transform: true,
      exceptionFactory: (errors) => new BadRequestException(this.formatErrors(errors)),
    });
  }

  private formatErrors(errors: any[]): string {
    return errors.map((err) => Object.values(err.constraints).join(', ')).join('; ');
  }
}
