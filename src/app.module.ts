// app.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(), // Load environment variables
    MongooseModule.forRoot(process.env.MONGO_URI),
    MulterModule.register({
      dest: './uploads', // Set your upload directory
    }),
    UserModule,
  ],
})
export class AppModule {}
