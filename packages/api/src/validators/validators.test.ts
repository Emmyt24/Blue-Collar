import { describe, it, expect } from 'vitest'
import { updateProfileRules, changePasswordRules, pushSubscriptionRules } from '../validations/user.js'
import { bulkDeleteRules, bulkToggleRules } from '../validations/admin.js'
import { tipRules, createEscrowRules, updateFeeRules } from '../validations/payment.js'

// ── User validators ───────────────────────────────────────────────────────────

describe('updateProfileRules', () => {
  it('accepts all optional fields present', () => {
    expect(updateProfileRules.safeParse({ firstName: 'Alice', lastName: 'Smith', email: 'a@b.com' }).success).toBe(true)
  })

  it('accepts empty object (all fields optional)', () => {
    expect(updateProfileRules.safeParse({}).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(updateProfileRules.safeParse({ email: 'not-an-email' }).success).toBe(false)
  })

  it('rejects empty firstName', () => {
    expect(updateProfileRules.safeParse({ firstName: '' }).success).toBe(false)
  })
})

describe('changePasswordRules', () => {
  it('accepts valid input', () => {
    expect(changePasswordRules.safeParse({ currentPassword: 'old-pass', newPassword: 'new-pass-123' }).success).toBe(true)
  })

  it('rejects missing currentPassword', () => {
    expect(changePasswordRules.safeParse({ newPassword: 'new-pass-123' }).success).toBe(false)
  })

  it('rejects newPassword shorter than 8 chars', () => {
    expect(changePasswordRules.safeParse({ currentPassword: 'old', newPassword: 'short' }).success).toBe(false)
  })
})

describe('pushSubscriptionRules', () => {
  const validSub = {
    endpoint: 'https://push.example.com/endpoint',
    keys: { auth: 'authkey', p256dh: 'p256dhkey' },
  }

  it('accepts valid subscription', () => {
    expect(pushSubscriptionRules.safeParse(validSub).success).toBe(true)
  })

  it('rejects non-URL endpoint', () => {
    expect(pushSubscriptionRules.safeParse({ ...validSub, endpoint: 'not-a-url' }).success).toBe(false)
  })

  it('rejects missing keys', () => {
    expect(pushSubscriptionRules.safeParse({ endpoint: validSub.endpoint }).success).toBe(false)
  })
})

// ── Admin validators ──────────────────────────────────────────────────────────

describe('bulkDeleteRules', () => {
  it('accepts a non-empty array of ids', () => {
    expect(bulkDeleteRules.safeParse({ ids: ['id1', 'id2'] }).success).toBe(true)
  })

  it('rejects empty ids array', () => {
    expect(bulkDeleteRules.safeParse({ ids: [] }).success).toBe(false)
  })

  it('rejects missing ids', () => {
    expect(bulkDeleteRules.safeParse({}).success).toBe(false)
  })
})

describe('bulkToggleRules', () => {
  it('accepts valid input', () => {
    expect(bulkToggleRules.safeParse({ ids: ['id1'], active: true }).success).toBe(true)
  })

  it('rejects non-boolean active', () => {
    expect(bulkToggleRules.safeParse({ ids: ['id1'], active: 'yes' }).success).toBe(false)
  })
})

// ── Payment validators ────────────────────────────────────────────────────────

describe('tipRules', () => {
  const validTip = {
    from: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWNA',
    to: 'GBCJLPKHE2QTXTYZNZG6K3OBRPHJHABT2MG6JLAMM5FOARHM2GL67VCW',
    amount: '10.5000000',
  }

  it('accepts valid tip', () => {
    expect(tipRules.safeParse(validTip).success).toBe(true)
  })

  it('rejects invalid from address', () => {
    expect(tipRules.safeParse({ ...validTip, from: 'not-stellar' }).success).toBe(false)
  })

  it('rejects invalid amount format', () => {
    expect(tipRules.safeParse({ ...validTip, amount: '-5' }).success).toBe(false)
  })

  it('rejects missing fields', () => {
    expect(tipRules.safeParse({ from: validTip.from }).success).toBe(false)
  })
})

describe('createEscrowRules', () => {
  const validEscrow = {
    from: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWNA',
    to: 'GBCJLPKHE2QTXTYZNZG6K3OBRPHJHABT2MG6JLAMM5FOARHM2GL67VCW',
    amount: '50.0000000',
    expiryDate: '2027-01-01T00:00:00.000Z',
  }

  it('accepts valid escrow', () => {
    expect(createEscrowRules.safeParse(validEscrow).success).toBe(true)
  })

  it('rejects invalid expiryDate format', () => {
    expect(createEscrowRules.safeParse({ ...validEscrow, expiryDate: 'not-a-date' }).success).toBe(false)
  })
})

describe('updateFeeRules', () => {
  it('accepts valid fee_bps', () => {
    expect(updateFeeRules.safeParse({ fee_bps: 250 }).success).toBe(true)
  })

  it('rejects negative fee_bps', () => {
    expect(updateFeeRules.safeParse({ fee_bps: -1 }).success).toBe(false)
  })

  it('rejects fee_bps above 500', () => {
    expect(updateFeeRules.safeParse({ fee_bps: 501 }).success).toBe(false)
  })

  it('rejects non-integer fee_bps', () => {
    expect(updateFeeRules.safeParse({ fee_bps: 1.5 }).success).toBe(false)
  })
})
