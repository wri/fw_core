import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

type TRequest = {
  body: {
    loggedUser: any;
  };
  query: any;
} & Request;

@Injectable()
export class CreateTemplateMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const { body } = <TRequest>req;

    const errors = [];

    if (!body.name)
      throw new HttpException(
        "Request body is missing field 'name'",
        HttpStatus.BAD_REQUEST,
      );
    if (!body.questions)
      throw new HttpException(
        "Request body is missing field 'questions'",
        HttpStatus.BAD_REQUEST,
      );
    if (!body.languages)
      throw new HttpException(
        "Request body is missing field 'languages'",
        HttpStatus.BAD_REQUEST,
      );
    if (!body.defaultLanguage)
      throw new HttpException(
        "Request body is missing field 'defaultLanguage'",
        HttpStatus.BAD_REQUEST,
      );
    if (!body.status)
      throw new HttpException(
        "Request body is missing field 'status'",
        HttpStatus.BAD_REQUEST,
      );
    if (!['published', 'unpublished'].includes(body.status))
      throw new HttpException(
        'Status must be published or unpublished',
        HttpStatus.BAD_REQUEST,
      );

    const pushError = (source, detail) => {
      errors.push({
        [source]: detail,
      });
    };

    const checkQuestion = (question) => {
      body.languages.forEach((lang) => {
        if (!question.label[lang]) {
          pushError(
            'name',
            `Question ${question.name}: label does not match language options`,
          );
        }
        if (question.type === 'text' && question.defaultValue) {
          if (!question.defaultValue[lang]) {
            pushError(
              'name',
              `Question ${question.name}: defaultValue does not match language options`,
            );
          }
        }
        if (
          question.type === 'select' ||
          question.type === 'radio' ||
          question.type === 'checkbox'
        ) {
          if (!question.values[lang]) {
            pushError(
              'name',
              `Question ${question.name}: values do not match language options`,
            );
          }
        }
      });
    };

    // check for languages
    if (body.languages.length > 1) {
      if (
        !body.defaultLanguage ||
        body.languages.indexOf(body.defaultLanguage) === -1
      ) {
        pushError(
          'languages',
          `Languages: values do not match language options`,
        );
      }
    }

    // check template names
    body.languages.forEach((lang) => {
      if (body.name[lang] === undefined) {
        pushError('Report name', 'values do not match language options');
      }
    });

    // check each question
    body.questions.forEach((question) => {
      checkQuestion(question);
      if (question.childQuestions) {
        question.childQuestions.forEach((childQuestion) => {
          checkQuestion(childQuestion);
        });
      }
    });

    if (errors.length > 0)
      throw new HttpException(errors, HttpStatus.BAD_REQUEST);

    await next();
  }
}
