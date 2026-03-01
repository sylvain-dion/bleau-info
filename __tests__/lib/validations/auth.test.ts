import { describe, it, expect } from 'vitest'
import { loginSchema, signupSchema } from '@/lib/validations/auth'

describe('loginSchema', () => {
  it('should accept valid email and password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('should reject empty email', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid email format', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })

  it('should reject password shorter than 6 characters', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '12345',
    })
    expect(result.success).toBe(false)
  })

  it('should accept password with exactly 6 characters', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '123456',
    })
    expect(result.success).toBe(true)
  })
})

describe('signupSchema', () => {
  it('should accept valid signup data with matching passwords', () => {
    const result = signupSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('should reject mismatched passwords', () => {
    const result = signupSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'different456',
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty confirmPassword', () => {
    const result = signupSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: '',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid email in signup', () => {
    const result = signupSchema.safeParse({
      email: 'invalid',
      password: 'password123',
      confirmPassword: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('should reject short password in signup', () => {
    const result = signupSchema.safeParse({
      email: 'test@example.com',
      password: '12345',
      confirmPassword: '12345',
    })
    expect(result.success).toBe(false)
  })
})
