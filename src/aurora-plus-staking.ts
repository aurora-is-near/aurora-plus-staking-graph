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

  // Index only VOTE token stream
  if (event.params.streamId.toU32() !== 5) return

  let staker = StakerBalance.load(event.params.user.toHex())

  if (staker === null) {
    // If claimed, staker must exist.
    return
  }

  staker.claimedVote = event.params.amount

  staker.save()
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

  // Index only VOTE token stream
  if (event.params.streamId.toU32() !== 5) return

  let staker = StakerBalance.load(event.params.user.toHex())

  if (staker === null) {
    // If claimed, staker must exist.
    return
  }

  // Withdrawing resets the pending amount
  staker.claimedVote = BigInt.fromU32(0)
  staker.withdrawnVote = staker.withdrawnVote.plus(event.params.amount)

  staker.save()
}

// https://github.com/aurora-is-near/aurora-staking-contracts/blob/4d258cb4c3e2f122ef1e6f0a55a824e72030ef7c/contracts/JetStakingV1.sol#L1043
function _weightedShares(shares: BigInt, timestamp: BigInt): BigInt {
  const ONE_MONTH = 2629746
  const FOUR_YEARS = BigInt.fromU64(126227808)
  const maxWeight = BigInt.fromU32(1024)
  const minWeight = BigInt.fromU32(256)
  const slopeStart = BigInt.fromU64(1652799600 + ONE_MONTH)
  const slopeEnd = slopeStart.plus(FOUR_YEARS)
  if (timestamp.le(slopeStart)) return shares.times(maxWeight)
  if (timestamp.ge(slopeEnd)) return shares.times(minWeight)
  return shares.times(minWeight).plus(
    shares
      .times(maxWeight.minus(minWeight))
      .times(slopeEnd.minus(timestamp))
      .div(slopeEnd.minus(slopeStart))
  )
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
    staker.streamShares = BigInt.fromU32(0)
    staker.claimedVote = BigInt.fromU32(0)
    staker.withdrawnVote = BigInt.fromU32(0)
  }

  staker.amount = staker.amount.plus(event.params.amount)
  staker.shares = staker.shares.plus(event.params.shares)
  staker.streamShares = staker.streamShares.plus(
    _weightedShares(event.params.shares, event.block.timestamp)
  )

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
  staker.streamShares = BigInt.fromU32(0)

  staker.save()
}
