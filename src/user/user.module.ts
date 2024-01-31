// user.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserModel, UserSchema } from './user.model';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './dto/jwt.strategy'; // Update with the correct path

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    PassportModule.register({ defaultStrategy: 'jwt' }), // Register Passport with the default jwt strategy
    JwtModule.register({
      secret: 'your-secret-key', // Replace with your actual secret key
      signOptions: { expiresIn: '1h' }, // Adjust the expiration time as needed
    }),
  ],
  controllers: [UserController],
  providers: [UserService, UserModel, JwtStrategy], // Provide UserModel and JwtStrategy
})
export class UserModule {}
