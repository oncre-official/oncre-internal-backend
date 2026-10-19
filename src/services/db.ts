import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClientSession, Connection } from 'mongoose';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  private isReplicaSet = false;

  constructor(
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async transaction<T>(callback: (session: ClientSession) => Promise<T>): Promise<T> {
    if (!this.isReplicaSet) {
      this.logger.log('Executing without transaction (not in replica set mode)');
      return await callback(null as any);
    }

    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const result = await callback(session);

      await session.commitTransaction();

      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * PRIVATE METHODS
   */

  private async checkReplicaSetStatus() {
    try {
      const admin = this.connection?.db?.admin();
      await admin?.command({ replSetGetStatus: 1 });

      this.isReplicaSet = true;
    } catch (error: any) {
      this.logger.log(`MongoDB is not running as a replica set. Transactions will be disabled, ${error?.message}`);

      this.isReplicaSet = false;
    }
  }
}
