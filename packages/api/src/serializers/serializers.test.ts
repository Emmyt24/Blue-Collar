import { describe, it, expect } from 'vitest'
import { userSerializer } from '../serializers/user.serializer.js'
import { categorySerializer } from '../serializers/category.serializer.js'
import { workerSerializer } from '../serializers/worker.serializer.js'

const mockUser: any = {
  id: 'u1', email: 'a@b.com', firstName: 'Jane', lastName: 'Doe',
  role: 'user', verified: true, password: 'secret',
  verificationToken: 'tok', verificationTokenExpiry: new Date(),
  resetToken: 'rst', resetTokenExpiry: new Date(),
  twoFactorSecret: 'sec', twoFactorBackupCodes: ['a'],
  googleId: null, walletAddress: null, avatar: null, bio: null, phone: null,
  referralCode: null, locationId: null, twoFactorEnabled: false,
  createdAt: new Date(), updatedAt: new Date(),
}

const mockCategory: any = {
  id: 'c1', name: 'Plumber', description: null, icon: null,
  createdAt: new Date(), updatedAt: new Date(),
}

const mockWorker: any = {
  id: 'w1', name: 'Bob', bio: null, avatar: null, phone: null, email: null,
  walletAddress: null, isActive: true, isVerified: false, stellarContractId: null,
  searchVector: null, categoryId: 'c1', curatorId: 'u1', locationId: null,
  createdAt: new Date(), updatedAt: new Date(),
  category: mockCategory, curator: mockUser,
}

describe('UserSerializer', () => {
  it('strips sensitive fields', () => {
    const result = userSerializer.serialize(mockUser)
    expect(result).not.toHaveProperty('password')
    expect(result).not.toHaveProperty('verificationToken')
    expect(result).not.toHaveProperty('resetToken')
    expect(result).not.toHaveProperty('twoFactorSecret')
    expect(result).not.toHaveProperty('twoFactorBackupCodes')
    expect(result.email).toBe('a@b.com')
  })

  it('serializes a collection', () => {
    const results = userSerializer.collection([mockUser, mockUser])
    expect(results).toHaveLength(2)
    results.forEach(r => expect(r).not.toHaveProperty('password'))
  })
})

describe('CategorySerializer', () => {
  it('returns expected fields', () => {
    const result = categorySerializer.serialize(mockCategory)
    expect(result).toMatchObject({ id: 'c1', name: 'Plumber' })
  })
})

describe('WorkerSerializer', () => {
  it('strips searchVector and nests relations', () => {
    const result = workerSerializer.serialize(mockWorker)
    expect(result).not.toHaveProperty('searchVector')
    expect(result.category).toMatchObject({ id: 'c1', name: 'Plumber' })
    expect(result.curator).not.toHaveProperty('password')
    expect(result.curator?.email).toBe('a@b.com')
  })
})
