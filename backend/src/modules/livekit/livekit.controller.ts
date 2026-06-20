import { Controller, Post, Body } from '@nestjs/common';
import { LivekitService } from './livekit.service';

@Controller('livekit')
export class LivekitController {
  constructor(private livekit: LivekitService) {}

  @Post('token')
  async token(@Body() dto: { room: string; identity?: string }) {
    const token = this.livekit.createToken(dto.room, dto.identity || `user-${Date.now()}`);
    return { token };
  }
}
