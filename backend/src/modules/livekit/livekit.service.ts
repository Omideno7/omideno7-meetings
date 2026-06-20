import { Injectable } from '@nestjs/common';
import { AccessToken, RoomGrant } from '@livekit/server-sdk';

@Injectable()
export class LivekitService {
  createToken(room: string, identity: string) {
    const apiKey = process.env.LIVEKIT_API_KEY || '';
    const apiSecret = process.env.LIVEKIT_API_SECRET || '';
    if (!apiKey || !apiSecret) {
      throw new Error('LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set');
    }

    const at = new AccessToken(apiKey, apiSecret, { identity });
    const grant = new RoomGrant({ room });
    at.addGrant(grant);
    return at.toJwt();
  }
}
