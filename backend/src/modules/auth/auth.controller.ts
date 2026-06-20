import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Controller('auth')
export class AuthController {
  constructor(private supabase: SupabaseService) {}

  @Post('create-user')
  async createUser(@Body() body: { email: string; password: string; fullName?: string }) {
    try {
      const user = await this.supabase.createUser(body.email, body.password, { fullName: body.fullName });
      return user;
    } catch (err) {
      throw new HttpException({ message: String(err) }, HttpStatus.BAD_REQUEST);
    }
  }
}
