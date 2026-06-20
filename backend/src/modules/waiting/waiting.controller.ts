import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { WaitingService } from './waiting.service';

@Controller('waiting')
export class WaitingController {
  constructor(private readonly waitingService: WaitingService) {}

  @Post('join')
  async join(@Body() dto: any) {
    return this.waitingService.join(dto);
  }

  @Get('meeting/:meetingId')
  async listForMeeting(@Param('meetingId') meetingId: string) {
    return this.waitingService.listForMeeting(meetingId);
  }

  @Post(':id/admit')
  async admit(@Param('id') id: string) {
    return this.waitingService.admit(id);
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string) {
    return this.waitingService.reject(id);
  }
}
