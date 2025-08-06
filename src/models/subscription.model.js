import mongoose, { Schema } from "mongoose";

const subscriptionScheme = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, //the user who is subscribing
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, //the channel being subscribed to
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionScheme);
