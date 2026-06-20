import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { AuthController } from './auth.controller';

@Module({
  providers: [SupabaseService],
  controllers: [AuthController],
  exports: [SupabaseService],
})
export class AuthModule {}
