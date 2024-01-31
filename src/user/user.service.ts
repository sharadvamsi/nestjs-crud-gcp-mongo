// user.service.ts

import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.model';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { FileInterceptor } from '@nestjs/platform-express';
import { v4 as uuid } from 'uuid';
import { Storage } from '@google-cloud/storage';
import { MulterFile } from 'multer';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Readable } from 'stream';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
  ) {}

  async getAllUsers(): Promise<User[]> {
    return this.userModel.find();
  }

  async getUserById(id: string): Promise<User> {
    return this.userModel.findById(id);
  }

  async createUser(createUserDto: CreateUserDto , profileImage?: MulterFile): Promise<string> {
    try {
      const { username, email, password } = createUserDto;

      const existingUserByUsername = await this.userModel.findOne({ username });
      

      if (existingUserByUsername) {
        
        return ('Username already exists');
      }

      const existingUserByEmail = await this.userModel.findOne({ email });
      
      if (existingUserByEmail) {
        return  'Email already exists'
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      let imageUrl: string;
      if (profileImage) {
        imageUrl = await this.uploadProfileImage(profileImage, username);
      }

      const user = new this.userModel({ username, email, password: hashedPassword, profileImage: imageUrl });
      await user.save();

      return `User ${user.username} has been created successfully`;
    } catch (error) {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async loginUser(username: string, password: string): Promise<string> {
    try {
      const user = await this.userModel.findOne({ username });

      if (!user) {
        throw new UnauthorizedException('User does not exist');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const token = jwt.sign({ username: user.username, sub: user._id }, 'secretKey', { expiresIn: '1h' });

      return token;
    } catch (error) {
      throw error;
    }
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto, profileImage?: MulterFile): Promise<User> {
    try {
      const user = await this.userModel.findById(id);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const { email, password } = updateUserDto;

      user.email = email || user.email;

      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }

      if (profileImage) {
        // Remove the old image from the storage bucket
        if (user.profileImage) {
          await this.deleteImage(user.profileImage);
        }

        // Upload the new image and get the URL
        user.profileImage = await this.uploadProfileImage(profileImage, user.username);
      }

      await user.save();

      return user;
    } catch (error) {
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const user = await this.userModel.findByIdAndDelete(id);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Delete the user's image from the storage bucket
      if (user.profileImage) {
        await this.deleteImage(user.profileImage);
      }
    } catch (error) {
      throw error;
    }
  }

  private async uploadProfileImage(file: MulterFile, username: string): Promise<string> {
    const storage = new Storage();
    const bucketName = process.env.GCP_BUCKET_NAME; // Replace with your GCP bucket name
    const fileName = `${uuid()}_${file.originalname}`;

    // Convert buffer to a readable stream
    const fileStream = new Readable();
    fileStream.push(file.buffer);
    fileStream.push(null);

    const writeStream = storage.bucket(bucketName).file(fileName).createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    fileStream.pipe(writeStream);

    await new Promise((resolve, reject) => {
      writeStream
        .on('finish', resolve)
        .on('error', (error) => {
          reject(error);
        });
    });

    const imageUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    return imageUrl;
  }

  private async deleteImage(imageUrl: string): Promise<void> {
    const storage = new Storage();
    const bucketName = process.env.GCP_BUCKET_NAME; // Replace with your GCP bucket name

    // Extract the filename from the URL
    const fileName = imageUrl.split('/').pop();

    // Delete the image from the storage bucket
    await storage.bucket(bucketName).file(fileName).delete();
  }
}
