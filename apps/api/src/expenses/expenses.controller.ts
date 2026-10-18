import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { AuthUser } from '../common/roles';
import { CreateExpenseDto, ListQueryDto, RejectDto } from './expenses.dto';
import { ExpensesService } from './expenses.service';

@ApiBearerAuth()
@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpensesController {
  constructor(private readonly service: ExpensesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateExpenseDto) {
    return this.service.create(user, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListQueryDto) {
    return this.service.list(user, query);
  }

  @Get('summary')
  @Roles('manager', 'finance')
  summary() {
    return this.service.summary();
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.service.get(id, user);
  }

  @Post(':id/approve')
  @Roles('manager')
  approve(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.service.transition(id, user, 'approved');
  }

  @Post(':id/reject')
  @Roles('manager')
  reject(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser, @Body() dto: RejectDto) {
    return this.service.transition(id, user, 'rejected', dto.reason);
  }

  @Post(':id/pay')
  @Roles('finance')
  pay(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.service.transition(id, user, 'paid');
  }
}
