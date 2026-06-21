import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CondominiumsModule } from './condominiums/condominiums.module';
import { UnitsModule } from './units/units.module';
import { ResidentsModule } from './residents/residents.module';
import { AccessLogsModule } from './access-logs/access-logs.module';
import { PackagesModule } from './packages/packages.module';
import { OccurrencesModule } from './occurrences/occurrences.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditModule } from './audit/audit.module';
import { ReportsModule } from './reports/reports.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    CondominiumsModule,
    UnitsModule,
    ResidentsModule,
    AccessLogsModule,
    PackagesModule,
    OccurrencesModule,
    DashboardModule,
    AuditModule,
    ReportsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
