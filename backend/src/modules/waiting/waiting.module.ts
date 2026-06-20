import { Module } from '@nestjs/common';
import { WaitingService } from './waiting.service';
import { WaitingController } from './waiting.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [WaitingController],
  providers: [WaitingService, PrismaService],
})
export class WaitingModule {}
