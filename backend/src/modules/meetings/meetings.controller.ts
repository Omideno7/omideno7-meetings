import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { MeetingsService } from './meetings.service';

@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  async create(@Body() dto: any) {
    return this.meetingsService.create(dto);
  }

  @Get()
  async list() {
    return this.meetingsService.findAll();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.meetingsService.findById(id);
  }
}
