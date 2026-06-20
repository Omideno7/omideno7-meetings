import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class RequestsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: any) {
    const rec = await this.prisma.accessRequest.create({ data: dto });
    return rec;
  }

  async findPending() {
    return this.prisma.accessRequest.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'desc' } });
  }
}
