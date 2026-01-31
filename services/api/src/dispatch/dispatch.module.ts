import { Module } from '@nestjs/common';
import { DispatchController } from './dispatch.controller';
import { DispatchService } from './dispatch.service';
import { DatabaseModule } from '../database/database.module';
import { DriversModule } from '../drivers/drivers.module';

@Module({
  imports: [DatabaseModule, DriversModule],
  controllers: [DispatchController],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
