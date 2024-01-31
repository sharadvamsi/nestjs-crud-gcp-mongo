// user.controller.ts

import { Controller, Post, Body, Get, Patch, Param, Delete, NotFoundException, UnauthorizedException, UsePipes, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ValidationPipeWithClassValidator } from './dto/validation.pipe';
import { JwtAuthGuard } from './dto/jwt-auth.guard';
import { MulterFile } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers() {
    const users = await this.userService.getAllUsers();
    return { users };
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    try {
      const user = await this.userService.getUserById(id);
      return { user };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  @Post('register')
  @UsePipes(new ValidationPipeWithClassValidator())
  @UseInterceptors(FileInterceptor('profileImage'))
  async createUser(@Body() createUserDto: CreateUserDto, @UploadedFile() profileImage: MulterFile) {
    try {
      const user = await this.userService.createUser(createUserDto, profileImage);
      return { user };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }

  @Post('login')
  @UsePipes(new ValidationPipeWithClassValidator())
  async loginUser(@Body() loginUserDto: LoginUserDto) {
    try {
      const { username, password } = loginUserDto;
      const token = await this.userService.loginUser(username, password);
      return { token };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }

  @Patch(':id')
  // @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('profileImage'))
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @UploadedFile() profileImage: MulterFile) {
    try {
      const user = await this.userService.updateUser(id, updateUserDto, profileImage);
      return { user };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Delete(':id')
 //  @UseGuards(JwtAuthGuard)
  async deleteUser(@Param('id') id: string) {
    try {
      await this.userService.deleteUser(id);
      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
