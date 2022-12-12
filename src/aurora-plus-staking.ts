import { BigInt } from "@graphprotocol/graph-ts"
import {
  Pending as PendingEvent,
  Released as ReleasedEvent,
  Staked as StakedEvent,
  StreamOwnerRewardReleased as StreamOwnerRewardReleasedEvent,
  Unstaked as UnstakedEvent,
} from "../generated/AuroraPlusStaking/AuroraPlusStaking"
import {
  Pending,
  Released,
  Staked,
  StreamOwnerRewardReleased,
  Unstaked,
  StakerBalance,
} from "../generated/schema"

export function handlePending(event: PendingEvent): void {
  let entity = new Pending(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.streamId = event.params.streamId
  entity.user = event.params.user
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleReleased(event: ReleasedEvent): void {
  let entity = new Released(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.streamId = event.params.streamId
  entity.user = event.params.user
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleStaked(event: StakedEvent): void {
  let entity = new Staked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.amount = event.params.amount
  entity.shares = event.params.shares

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  let staker = StakerBalance.load(event.params.user.toHex())

  if (staker === null) {
    staker = new StakerBalance(event.params.user.toHex())
    staker.user = event.params.user
    staker.amount = BigInt.fromU32(0)
    staker.shares = BigInt.fromU32(0)
  }

  staker.amount = staker.amount.plus(event.params.amount)
  staker.shares = staker.shares.plus(event.params.shares)

  staker.save()
}

export function handleStreamOwnerRewardReleased(
  event: StreamOwnerRewardReleasedEvent
): void {
  let entity = new StreamOwnerRewardReleased(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.streamId = event.params.streamId
  entity.owner = event.params.owner
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUnstaked(event: UnstakedEvent): void {
  let entity = new Unstaked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  let staker = StakerBalance.load(event.params.user.toHex())

  if (staker === null) {
    // If unstaking, staker must exist.
    return
  }

  // All is unstaked, partial unstake is re-staked and handled by handleStaked
  staker.amount = BigInt.fromU32(0)
  staker.shares = BigInt.fromU32(0)

  staker.save()
}
