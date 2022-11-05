import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ValidateBodyIsNotEmptyPipe implements PipeTransform {
  transform(value: any) {
    const keys = Object.keys(value);
    if (!value || keys.every((key) => key === 'loggedUser'))
      throw new BadRequestException('body cannot be empty');
    return value;
  }
}
