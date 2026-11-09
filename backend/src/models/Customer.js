import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 80,
    },
    username: {
      type: String,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    phone: {
      type: String,
      match: /^[6-9]\d{9}$/,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    googleId: {
      type: String,
    },
  },
  { timestamps: true },
);

customerSchema.index({ username: 1 }, { unique: true, sparse: true });
customerSchema.index({ phone: 1 }, { unique: true, sparse: true });
customerSchema.index({ email: 1 }, { unique: true, sparse: true });
customerSchema.index({ googleId: 1 }, { unique: true, sparse: true });

export default mongoose.model("Customer", customerSchema);
