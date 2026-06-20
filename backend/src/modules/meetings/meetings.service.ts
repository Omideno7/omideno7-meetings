import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class MeetingsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: any) {
    const rec = await this.prisma.meeting.create({ data: dto });
    return rec;
  }

  async findAll() {
    return this.prisma.meeting.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string) {
    return this.prisma.meeting.findUnique({ where: { id } });
  }
}
