import { Module } from '@nestjs/common';
import { RequestsModule } from './modules/requests/requests.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { WaitingModule } from './modules/waiting/waiting.module';
import { LivekitModule } from './modules/livekit/livekit.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [RequestsModule, MeetingsModule, WaitingModule, LivekitModule, AuthModule],
})
export class AppModule {}
