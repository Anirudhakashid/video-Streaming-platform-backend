import mongoose, { Schema } from "mongoose";

// a document contains a subscriber and a channel
// to keep track of who is subscribed to whom
// to count a user's (channels) subscribers we count the number of documents where that channel is present
// to get a user's (subscriber) subscriptions we find all documents where that user is the subscriber

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
