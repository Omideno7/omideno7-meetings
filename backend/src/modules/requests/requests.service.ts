import { Injectable } from '@nestjs/common';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'blocked';

@Injectable()
export class RequestsService {
  private items = [] as any[];

  create(dto: any) {
    const id = `${Date.now()}`;
    const item = { id, ...dto, status: 'pending', createdAt: new Date().toISOString() };
    this.items.push(item);
    // TODO: persist to DB
    return item;
  }

  findPending() {
    return this.items.filter((i) => i.status === 'pending');
  }
}
