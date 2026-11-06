import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TermiiService } from '@on/services/termii/service';

import { LogModule } from '../log/log.module';
import { RoleModule } from '../role/role.module';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';

import { Task, TaskSchema } from './model/task.model';
import { TaskRepository } from './repository/task.repository';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
    UserModule,
    LogModule,
    RoleModule,
    SharedModule,
  ],
  controllers: [TaskController],
  providers: [TaskRepository, TaskService, TermiiService, TaskRepository],
  exports: [TaskRepository, TaskService, TaskRepository],
})
export class TaskModule {}
