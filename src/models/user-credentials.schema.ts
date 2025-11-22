import { Schema, model, Types, HydratedDocument } from "mongoose";

export interface RefreshToken {
  token: string;
  expiresAt: Date;
  createdAt: Date;
  deviceInfo?: string;
  ipAddress?: string;
}

export interface PasswordReset {
  token: string;
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
}

export interface UserCredentials {
  staffProfileId: Types.ObjectId;
  email: string;
  password: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  refreshTokens: RefreshToken[];
  passwordResetTokens: PasswordReset[];
  passwordChangedAt?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  lastPasswordChange?: Date;
  failedLoginAttempts: number;
  accountLockedUntil?: Date;
}

export type UserCredentialsDocument = HydratedDocument<UserCredentials>;

const RefreshTokenSchema = new Schema<RefreshToken>(
  {
    token: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    deviceInfo: String,
    ipAddress: String,
  },
  { _id: false }
);

const PasswordResetSchema = new Schema<PasswordReset>(
  {
    token: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const UserCredentialsSchema = new Schema<UserCredentials>(
  {
    staffProfileId: {
      type: Schema.Types.ObjectId,
      ref: "StaffProfile",
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't return password by default
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpiry: Date,
    refreshTokens: [RefreshTokenSchema],
    passwordResetTokens: [PasswordResetSchema],
    passwordChangedAt: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    lastPasswordChange: Date,
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    accountLockedUntil: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
UserCredentialsSchema.index({ "refreshTokens.token": 1 });
UserCredentialsSchema.index({ "refreshTokens.expiresAt": 1 });

// Method to check if account is locked
UserCredentialsSchema.methods.isAccountLocked = function (): boolean {
  if (!this.accountLockedUntil) return false;
  return this.accountLockedUntil > new Date();
};

// Method to increment failed login attempts
UserCredentialsSchema.methods.incrementFailedAttempts = async function () {
  this.failedLoginAttempts += 1;

  // Lock account after 5 failed attempts for 30 minutes
  if (this.failedLoginAttempts >= 5) {
    this.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000);
  }

  await this.save();
};

// Method to reset failed login attempts
UserCredentialsSchema.methods.resetFailedAttempts = async function () {
  this.failedLoginAttempts = 0;
  this.accountLockedUntil = undefined;
  await this.save();
};

// Method to add refresh token
UserCredentialsSchema.methods.addRefreshToken = async function (
  token: string,
  expiresAt: Date,
  deviceInfo?: string,
  ipAddress?: string
) {
  // Remove expired tokens
  this.refreshTokens = this.refreshTokens.filter(
    (rt : any) => rt.expiresAt > new Date()
  );

  // Limit to 5 active tokens per user (5 devices)
  if (this.refreshTokens.length >= 5) {
    this.refreshTokens.shift(); // Remove oldest token
  }

  this.refreshTokens.push({
    token,
    expiresAt,
    createdAt: new Date(),
    deviceInfo,
    ipAddress,
  });

  await this.save();
};

// Method to remove refresh token
UserCredentialsSchema.methods.removeRefreshToken = async function (
  token: string
) {
  this.refreshTokens = this.refreshTokens.filter((rt : any) => rt.token !== token);
  await this.save();
};

// Method to remove all refresh tokens (logout from all devices)
UserCredentialsSchema.methods.removeAllRefreshTokens = async function () {
  this.refreshTokens = [];
  await this.save();
};

export const UserCredentialsModel = model<UserCredentials>(
  "UserCredentials",
  UserCredentialsSchema
);