import { Module } from '@nestjs/common';
import { RequestsModule } from './modules/requests/requests.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { WaitingModule } from './modules/waiting/waiting.module';
import { LivekitModule } from './modules/livekit/livekit.module';

@Module({
  imports: [RequestsModule, MeetingsModule, WaitingModule, LivekitModule],
})
export class AppModule {}
