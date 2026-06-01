import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  listUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.adminService.listUsers(Number(page), Math.min(Number(limit), 100), search);
  }

  @Post('users/:id/ban')
  banUser(@Param('id') id: string) {
    return this.adminService.banUser(id);
  }

  @Post('users/:id/unban')
  unbanUser(@Param('id') id: string) {
    return this.adminService.unbanUser(id);
  }

  @Get('pending-approval')
  pending() {
    return this.adminService.pendingApprovals();
  }

  @Post('transactions/:id/approve')
  approve(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body('approve') approve: boolean,
  ) {
    return this.adminService.approveTransaction(id, approve !== false, admin.userId);
  }

  @Get('transactions')
  allTransactions(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllTransactions(
      Number(page),
      Math.min(Number(limit), 100),
      type,
      status,
    );
  }

  @Get('analytics/overview')
  analytics() {
    return this.adminService.analytics();
  }

  @Get('bank-accounts')
  listBankAccounts(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.adminService.listBankAccounts(Number(page), Math.min(Number(limit), 100));
  }

  @Post('bank-accounts/:id/verify')
  verifyBankAccount(
    @Param('id') id: string,
    @Body('isVerified') isVerified: boolean,
  ) {
    return this.adminService.verifyBankAccount(id, isVerified !== false);
  }

  @Delete('bank-accounts/:id')
  deleteBankAccount(@Param('id') id: string) {
    return this.adminService.deleteBankAccount(id);
  }
}
