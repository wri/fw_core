import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as Sentry from '@sentry/node';
import ErrorSerializer from './common/error.serializer';
import { IUser } from './common/user.model';
import { TemplateDocument } from './templates/models/template.schema';
import { TeamDocument } from './teams/models/team.schema';

declare global {
  namespace Express {
    interface Request {
      user: IUser;
      template: TemplateDocument;
      userTeams: TeamDocument[];
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix('v3/gfw');

  app.use(async (req, res, next) => {
    try {
      await next();
    } catch (inErr: any) {
      let error = inErr;
      try {
        error = JSON.parse(inErr);
      } catch (e) {
        Logger.error('Could not parse error message - is it JSON?: ', inErr);
        error = inErr;
      }
      res.status = error.status || res.status || 500;
      if (res.status >= 500) {
        //Sentry.captureException(error); // send error to sentry
        Logger.error(error);
      } else {
        Logger.log(error);
      }

      res.body = ErrorSerializer.serializeError(res.status, error.message);
      if (process.env.NODE_ENV === 'production' && res.status === 500) {
        res.body = 'Unexpected error';
      }
      res.type = 'application/vnd.api+json';
    }
  });

  await app.listen(process.env.PORT ?? 4042);
  console.log(`App running on: ${await app.getUrl()}`);
}
bootstrap();
