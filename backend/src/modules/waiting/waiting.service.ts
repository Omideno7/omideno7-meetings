import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class WaitingService {
  constructor(private prisma: PrismaService) {}

  async join(dto: any) {
    const rec = await this.prisma.waitingEntry.create({ data: dto });
    return rec;
  }

  async listForMeeting(meetingId: string) {
    return this.prisma.waitingEntry.findMany({ where: { meetingId }, orderBy: { createdAt: 'asc' } });
  }

  async admit(id: string) {
    await this.prisma.waitingEntry.update({ where: { id }, data: { status: 'admitted' } });
    return { success: true };
  }

  async reject(id: string) {
    await this.prisma.waitingEntry.update({ where: { id }, data: { status: 'rejected' } });
    return { success: true };
  }
}
