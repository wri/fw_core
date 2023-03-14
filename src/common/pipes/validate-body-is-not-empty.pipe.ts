import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ValidateBodyIsNotEmptyPipe implements PipeTransform {
  transform(value: any) {
    const keys = Object.keys(value);
    if (!value || keys.length === 0)
      throw new BadRequestException('body cannot be empty');
    return value;
  }
}
