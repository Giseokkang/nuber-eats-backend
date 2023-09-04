import { PubSub } from 'graphql-subscriptions';
import { Module } from '@nestjs/common';
import { PUB_SUB } from './common.constants';

@Module({
  providers: [
    {
      provide: PUB_SUB,
      useValue: new PubSub(),
    },
  ],
  exports: [PUB_SUB],
})
export class CommonModule {}
