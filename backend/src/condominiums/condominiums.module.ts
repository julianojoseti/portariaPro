import { Module } from '@nestjs/common';
import { CondominiumsService } from './condominiums.service';
import { CondominiumsController } from './condominiums.controller';

@Module({
  controllers: [CondominiumsController],
  providers: [CondominiumsService],
  exports: [CondominiumsService],
})
export class CondominiumsModule {}
